# 🔎 Buscas Inteligentes no Banco de Dados

> **Tema:** por que `LIKE '%ana%'` quebra em produção e o que usar no lugar
> **Base:** [sql-basico.md](sql-basico.md)
> **Cobre:** `LIKE`/`ILIKE` → Full-Text Search → busca fuzzy (trigram) → tipos de índice → como ler o plano de execução → quando sair para um motor dedicado
> **Bancos:** PostgreSQL · MySQL · SQLite · Oracle · SQL Server

---

## 🎯 O ponto de partida

A query que todo mundo escreve no primeiro dia:

```sql
SELECT * FROM usuarios WHERE nome LIKE '%ana%';
```

Ela **funciona** — e é exatamente esse o problema. Funciona com 100 linhas na sua máquina, passa no code review, vai para produção, e seis meses depois derruba a aplicação inteira às 14h de uma terça-feira.

Este documento explica **por quê**, **o que acontece na prática** e **como você comprova isso em 5 minutos**.

---

## 📖 Conceito 1 — Anatomia do `LIKE`

### Os curingas

| Curinga | Significado | Exemplo | Casa com |
|---------|-------------|---------|----------|
| `%` | zero ou mais caracteres | `'ana%'` | `ana`, `anabel`, `anaconda` |
| `_` | **exatamente um** caractere | `'an_'` | `ana`, `ano` — mas não `anna` |
| `[]` | conjunto (só SQL Server) | `'[ac]na'` | `ana`, `cna` |

### As três posições e o que cada uma custa

```sql
WHERE nome LIKE 'ana%'    -- PREFIXO  → pode usar índice B-tree  ✅
WHERE nome LIKE '%ana'    -- SUFIXO   → não usa índice           ❌
WHERE nome LIKE '%ana%'   -- CONTÉM   → não usa índice           ❌
```

### ⚠️ Case e acento mudam de banco para banco

Essa é a fonte nº 1 de bug "funciona no meu SQLite, some no Postgres":

| Banco | `LIKE` é case-sensitive? | `LIKE` é acento-sensitive? |
|-------|--------------------------|----------------------------|
| **PostgreSQL** | ✅ **Sim** — `'%ana%'` **não** acha `Ana` | ✅ Sim |
| **MySQL 8** (collation `..._ai_ci` padrão) | ❌ Não — acha `Ana` e `ANA` | ❌ Não — acha `Âna` |
| **SQLite** | ❌ Não, **só para ASCII** — acha `Ana` | ✅ Sim — `%angela%` **não** acha `Ângela` |
| **SQL Server** | Depende da collation (padrão `CI` = não) | Depende (`AI`/`AS`) |

> ✅ **Verificado nesta máquina** (SQLite 3.50): `LIKE '%ana%'` retornou `Mariana Souza` **e** `Ana Paula`; `LIKE '%angela%'` retornou **zero** linhas mesmo existindo `Ângela Costa`.

No PostgreSQL, o equivalente case-insensitive é `ILIKE`:

```sql
WHERE nome ILIKE '%ana%'   -- acha 'Ana', 'ANA', 'mariana'
```

Mas `ILIKE` **também** ignora acento? **Não.** `ILIKE '%angela%'` continua sem achar `Ângela`. Acento é problema separado (resolvido com `unaccent`, mais abaixo).

---

## 🐌 Conceito 2 — Por que `%ana%` é lento

### Como um índice B-tree funciona

Um índice é uma **árvore ordenada alfabeticamente**. Igual ao índice remissivo no fim de um livro:

```
              [ M ]
             /     \
        [ D ]       [ S ]
       /    \       /    \
   Ana... Carla  Mariana  Tereza
```

Para achar `LIKE 'ana%'`, o banco desce a árvore direto até o `A` e lê o bloco contíguo. **Log(n)** — em 10 milhões de linhas são ~24 saltos.

Para achar `LIKE '%ana%'`, o `%` inicial diz: *"pode começar com qualquer coisa"*. A ordenação alfabética vira **inútil** — `Mariana`, `Joana` e `Luana` estão espalhados em ramos completamente diferentes da árvore. Só resta uma saída:

```
Seq Scan (varredura sequencial)
├── linha 1        → compara
├── linha 2        → compara
├── ...
└── linha 10000000 → compara
```

**O(n).** Dez milhões de comparações de string, a cada requisição.

### 🪤 Armadilha extra do PostgreSQL

Mesmo o caso "bom" (`LIKE 'ana%'`) **não usa índice** no PostgreSQL se o banco estiver numa locale diferente de `C` — o que é o padrão em qualquer instalação `pt_BR.UTF-8`. É preciso criar o índice com um operator class específico:

```sql
CREATE INDEX idx_usuarios_nome ON usuarios (nome text_pattern_ops);
```

Sem isso, seu `LIKE 'ana%'` faz Seq Scan silenciosamente e ninguém percebe até a tabela crescer.

---

## 🔤 Conceito 3 — Full-Text Search (FTS)

FTS não compara strings. Ele **entende texto**. O pipeline tem 4 etapas:

```
Texto original:  "Vende camisas azuis e corre no parque"
                            │
    1. TOKENIZAÇÃO          ▼   quebra em palavras
        ["vende", "camisas", "azuis", "e", "corre", "no", "parque"]
                            │
    2. STOP WORDS           ▼   descarta palavras sem valor de busca
        ["vende", "camisas", "azuis", "corre", "parque"]
                            │
    3. STEMMING             ▼   reduz ao radical (depende do idioma!)
        ["vend", "camis", "azul", "corr", "parqu"]
                            │
    4. ÍNDICE INVERTIDO     ▼
```

### O índice invertido

Em vez de "linha → texto", ele guarda "palavra → linhas":

```
 radical  →  linhas onde aparece
─────────────────────────────────
 "camis"  →  [3, 17, 402, 9981]
 "azul"   →  [17, 55, 402]
 "corr"   →  [1, 3, 88]
```

Buscar `camisa` vira uma consulta de chave — **instantânea**, independente do tamanho da tabela. E como a busca é por *radical*, `camisa` acha `camisas`, e `correr` acha `correndo`.

### O que FTS te dá que `LIKE` nunca dará

| Recurso | `LIKE` | FTS |
|---------|--------|-----|
| Plural/conjugação (`camisa` ↔ `camisas`) | ❌ | ✅ stemming |
| Ignorar `de`, `a`, `o`, `para` | ❌ | ✅ stop words |
| Ordenar por relevância | ❌ | ✅ `ts_rank` / score |
| Buscar 2 palavras em qualquer ordem | ❌ | ✅ |
| Destacar o trecho encontrado | ❌ | ✅ `ts_headline` |
| Usa índice | ❌ (com `%` à esquerda) | ✅ sempre |

### 🪤 O que FTS **não** faz

- **Não acha substring no meio da palavra.** Buscar `mari` não acha `Mariana` — a unidade é a palavra inteira. Para isso existe prefixo (`mari:*`) ou trigram.
- **Não corrige erro de digitação.** `calsa` não acha `calça`.
- **Depende do idioma configurado.** Configurar o dicionário errado (inglês num texto em português) desliga o stemming na prática.

---

## 🔍 Conceito 4 — Busca fuzzy (tolerante a erro)

Para quando o usuário digita errado — e ele **vai** digitar errado.

### Trigramas (`pg_trgm` no PostgreSQL)

A palavra é quebrada em sequências de 3 letras:

```
"mariana"  →  {  m, ma, mar, ari, ria, ian, ana, na }
"marianna" →  {  m, ma, mar, ari, ria, ian, ann, nna, na }
                └──────── 6 trigramas em comum ────────┘
```

Quanto mais trigramas em comum, maior a **similaridade** (0 a 1). O ganho decisivo: um índice **GIN de trigramas acelera `LIKE '%ana%'` e `ILIKE`** — resolve o problema do `%` à esquerda sem trocar a query.

### Distância de Levenshtein

Número mínimo de edições (inserir/remover/trocar letra) para transformar uma palavra na outra. `calsa` → `calça` = **1**. Ótimo para "você quis dizer…", mas **não é indexável** — use só sobre um conjunto já reduzido, nunca sobre a tabela inteira.

---

## 🗂️ Conceito 5 — O índice: tipos, sintaxe e custo

Os conceitos anteriores usaram índices de passagem. Aqui eles ficam no centro — porque **escolher o tipo errado de índice é o mesmo que não ter índice nenhum**, e ninguém percebe até a tabela crescer.

### Cada tipo de índice resolve um problema diferente

| Tipo | Onde existe | Serve para | **Não** serve para |
|------|-------------|-----------|--------------------|
| **B-tree** (padrão) | Todos | `=`, `<`, `>`, `BETWEEN`, `ORDER BY`, `LIKE 'prefixo%'` | `LIKE '%meio%'` |
| **Hash** | PostgreSQL, MySQL (MEMORY) | Só igualdade `=` | Ranges e ordenação |
| **GIN** | PostgreSQL | `tsvector` (FTS), trigram, `jsonb`, arrays | Tabelas com escrita muito pesada |
| **GiST** | PostgreSQL | Geo, ranges, trigram por similaridade | FTS puro (GIN é mais rápido para leitura) |
| **FULLTEXT** | MySQL | `MATCH ... AGAINST` | `LIKE`, termos com menos de 3 letras |
| **CONTEXT** | Oracle | `CONTAINS()`, Oracle Text | Consistência imediata (não é transacional) |
| **FTS5** | SQLite | `MATCH` | É uma *tabela virtual* separada, não um índice sobre a original |

### A sintaxe em cada banco

```sql
-- ── Índice comum (B-tree) — todos os bancos ──
CREATE INDEX idx_nome ON produtos (name);
CREATE UNIQUE INDEX idx_sku ON produtos (sku);
CREATE INDEX idx_nome_preco ON produtos (name, price);   -- composto
DROP INDEX idx_nome;                                     -- MySQL: DROP INDEX idx_nome ON produtos;

-- ── Full-Text ──
-- MySQL
CREATE FULLTEXT INDEX search_idx ON products (name, description);
ALTER TABLE products ADD FULLTEXT INDEX search_idx (name, description);   -- equivalente

-- PostgreSQL
CREATE INDEX search_idx ON products
  USING gin (to_tsvector('portuguese', name || ' ' || description));

-- PostgreSQL (trigram, para salvar o LIKE '%x%')
CREATE INDEX search_idx ON products USING gin (name gin_trgm_ops);

-- Oracle
CREATE INDEX search_idx ON products(description)
  INDEXTYPE IS CTXSYS.CONTEXT PARAMETERS ('SYNC (ON COMMIT)');

-- SQLite (tabela virtual, não índice)
CREATE VIRTUAL TABLE products_fts USING fts5(name, description, content='products');
```

### 🔥 O caso do MySQL, na prática

```sql
CREATE FULLTEXT INDEX search_idx ON products (name, description);

SELECT * FROM products
WHERE MATCH(name, description) AGAINST('FONE VERMELHO');
```

Está correto — e tem **quatro comportamentos** que pegam quase todo mundo:

**1. `MATCH()` precisa listar exatamente as mesmas colunas do índice**

```sql
-- índice é (name, description)
WHERE MATCH(name) AGAINST('FONE')                  -- ❌ ERROR 1191: Can't find FULLTEXT
                                                   --    index matching the column list
WHERE MATCH(name, description) AGAINST('FONE')     -- ✅
```

Mesmas colunas, mesma ordem. Se você precisa buscar só em `name`, precisa de **outro** índice `FULLTEXT (name)`. Não existe "prefixo mais à esquerda" para FULLTEXT — ao contrário do B-tree.

**2. `AGAINST('FONE VERMELHO')` é `OR`, não `AND`** ← a mais importante

Em NATURAL LANGUAGE MODE (o default), a busca retorna tudo que tenha **`FONE` OU `VERMELHO`**. Um fone preto e uma camiseta vermelha entram no resultado. A relevância empurra o item certo para cima, mas o cliente vê a camiseta na página 1.

Para exigir os dois termos:

```sql
SELECT * FROM products
WHERE MATCH(name, description) AGAINST('+FONE +VERMELHO' IN BOOLEAN MODE);
```

| Operador (BOOLEAN MODE) | Efeito |
|---|---|
| `+termo` | obrigatório |
| `-termo` | exclui |
| `termo*` | prefixo (`camis*` acha `camisa`, `camisas`) |
| `"frase exata"` | sequência exata |
| `>termo` / `<termo` | aumenta / diminui relevância |

**3. A ordenação por relevância é implícita — e invisível**

Em NATURAL LANGUAGE MODE sem `ORDER BY`, o MySQL já devolve ordenado por relevância decrescente. Funciona, mas é frágil: qualquer `ORDER BY price` que alguém adicione depois descarta silenciosamente a ordenação por relevância. Melhor tornar o score explícito:

```sql
SELECT *, MATCH(name, description) AGAINST('FONE VERMELHO') AS score
FROM products
WHERE MATCH(name, description) AGAINST('FONE VERMELHO')
ORDER BY score DESC
LIMIT 20;
```

> 💡 Repetir o `MATCH` no `SELECT` e no `WHERE` **não** custa duas buscas — o MySQL reaproveita o resultado.

**4. Criar o índice numa tabela grande trava a escrita**

O `CREATE FULLTEXT INDEX` roda como `ALGORITHM=INPLACE`, mas **não permite DML concorrente** — `INSERT`/`UPDATE` na tabela ficam bloqueados até terminar. Pior: o **primeiro** índice FULLTEXT de uma tabela precisa criar a coluna oculta `FTS_DOC_ID`, o que exige **reconstruir a tabela inteira**. Numa `products` de 20 milhões de linhas isso é janela de manutenção, não deploy de terça à tarde.

### Duas regras universais que derrubam índices

> ✅ **Verificado nesta máquina** (SQLite, 50.000 linhas, índice composto `(nome, preco)`).

**Regra 1 — prefixo mais à esquerda:** um índice composto só serve a partir da primeira coluna.

```
WHERE nome = ?              -> SEARCH p USING INDEX idx_nome_preco (nome=?)          ✅
WHERE nome = ? AND preco = ? -> SEARCH p USING INDEX idx_nome_preco (nome=? AND preco=?) ✅
WHERE preco = ?             -> SCAN p                                                 ❌
```

Filtrar só pela **segunda** coluna ignora o índice. A ordem das colunas na criação é uma decisão de projeto, não detalhe.

**Regra 2 — coluna dentro de função mata o índice:**

```
WHERE descricao = ?          -> SEARCH p USING INDEX idx_desc (descricao=?)  ✅
WHERE lower(descricao) = ?   -> SCAN p                                        ❌
```

O índice guarda `descricao`, não `lower(descricao)`. A saída é um **índice funcional** — confirmado, volta a usar índice:

```sql
CREATE INDEX idx_desc_lower ON produtos (lower(descricao));
-- -> SEARCH p USING INDEX idx_desc_lower (<expr>=?)   ✅
```

É a mesma raiz do problema do `unaccent()` no PostgreSQL: quem decide é a **expressão**, não a coluna.

### 💸 Índice não é de graça

| Custo | Detalhe |
|-------|---------|
| **Escrita** | Todo `INSERT`/`UPDATE`/`DELETE` atualiza **todos** os índices da tabela. 8 índices = 8 estruturas para manter a cada linha gravada |
| **Disco** | Um GIN de trigram pode ficar **maior que a própria tabela** |
| **Memória** | Índice que não cabe em cache vai ao disco — e perde boa parte da vantagem |
| **Manutenção** | Bloat no PostgreSQL (`REINDEX`), fragmentação no Oracle Text (`CTX_DDL.OPTIMIZE_INDEX`) |

> ⚠️ O anti-padrão comum é indexar toda coluna que aparece num `WHERE`. O resultado é uma tabela de leitura rápida e escrita lenta, com metade dos índices nunca usados.

### Descobrindo índices mortos

```sql
-- PostgreSQL: idx_scan = 0 significa que nunca foi usado desde o último reset
SELECT relname, indexrelname, idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) AS tamanho
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- MySQL 8
SELECT * FROM sys.schema_unused_indexes;

-- Oracle
ALTER INDEX idx_nome MONITORING USAGE;
SELECT * FROM v$object_usage;
```

---

## 🗺️ Qual técnica usar

| Necessidade | Solução | Custo |
|-------------|---------|-------|
| Autocomplete por prefixo (`ana%`) | B-tree + `text_pattern_ops` | Baixo |
| Filtro admin, tabela < 50k linhas | `LIKE '%x%'` mesmo | Zero — e tudo bem |
| Contém, em tabela grande | Índice GIN trigram (`pg_trgm`) | Médio (escrita + disco) |
| Busca por palavras, relevância, plural | FTS nativo (`tsvector` / `FULLTEXT`) | Médio |
| Tolerar erro de digitação | Trigram similarity / Levenshtein | Médio |
| Facetas, sinônimos, multi-idioma, milhões de docs | Elasticsearch / OpenSearch / Meilisearch | **Alto** (infra nova, sync, consistência eventual) |

> 💡 **Regra prática:** só saia do banco relacional quando o FTS nativo comprovadamente não der conta. Um Elasticsearch mal mantido é pior que um `tsvector` bem feito — você troca uma query lenta por um sistema distribuído fora de sincronia.

---

## 💥 O que acontece na vida real

### 1. O autocomplete que derruba a aplicação inteira

O cenário clássico. Campo de busca dispara a query **a cada tecla digitada**:

```
usuário digita "mariana"  →  7 requisições
7 requisições × Seq Scan em 5M linhas × 200 usuários simultâneos
= 7.000.000.000 comparações de string
```

CPU do banco a 100%. E aqui está a parte que pega todo mundo de surpresa: **não é só a busca que cai**. As conexões ficam presas, o *connection pool* esgota, e queries que nada têm a ver — login, checkout, listagem — começam a dar timeout esperando conexão. O incidente é reportado como "o site caiu", e ninguém suspeita do campo de busca.

### 2. "O cliente existe, mas o sistema não acha"

Atendente procura `joao silva`. O cadastro é `João Silva`. Zero resultados no PostgreSQL (acento). O atendente **cadastra o cliente de novo** — e agora existem dois registros do mesmo cliente, com históricos divididos. Esse é um bug de *dados*, não de performance, e é muito mais caro de limpar depois.

### 3. A venda perdida no plural

Catálogo tem `Camisa Polo Azul`. Cliente busca `camisas polo`. `LIKE '%camisas polo%'` → nada. O produto existe, está em estoque, e o cliente vai embora achando que a loja não vende. Nenhum log de erro é gerado — a query "funcionou", retornou zero linhas.

### 4. LIKE injection — o `%` digitado pelo usuário

Esse é sutil e sobrevive até a *prepared statements*. Você está seguro contra SQL Injection:

```python
cursor.execute("SELECT * FROM usuarios WHERE nome LIKE ?", ('%' + termo + '%',))
```

O termo é parametrizado — **não há SQL Injection**. Mas se o usuário digitar `%`, o valor final vira `%%%`, que casa com **todas as linhas da tabela**.

> ✅ **Verificado nesta máquina:** input `%` retornou **3 de 3 linhas** da tabela.

Numa tabela de milhões de registros isso é um vazamento de dados (a paginação limita a resposta, mas a query lê tudo) somado a um DoS de graça — qualquer um derruba seu banco digitando um caractere. **A correção é escapar os curingas:**

```sql
WHERE nome LIKE '%' || replace(replace(termo, '\', '\\'), '%', '\%') || '%' ESCAPE '\'
```

### 5. O índice que ninguém percebeu que parou de ser usado

Alguém troca `LIKE 'ana%'` por `ILIKE 'ana%'` para "melhorar a busca". Funciona igual, ninguém nota nada no code review — e o índice B-tree parou de ser usado. A degradação aparece semanas depois, quando a tabela cresce, e a causa já está enterrada no histórico do git.

---

## 📊 Lendo o plano de execução (`EXPLAIN ANALYZE`)

Toda a discussão acima só vira decisão técnica quando você **mede**. O plano de execução é a resposta do banco para a pergunta *"como você pretende resolver essa query?"* — e é a única forma de provar que o índice está sendo usado.

### `EXPLAIN` vs `EXPLAIN ANALYZE` — a diferença que importa

| | `EXPLAIN` | `EXPLAIN ANALYZE` |
|---|---|---|
| Executa a query? | ❌ Não | ✅ **Sim** |
| Números são | **Estimativa** do otimizador | **Medição real** |
| Tempo de resposta | Instantâneo | O tempo real da query |
| Serve para | Query lenta demais para rodar | Descobrir por que está lenta |

### ⚠️ `EXPLAIN ANALYZE` executa de verdade

Isso é inofensivo num `SELECT` e **destrutivo** num `DELETE`:

```sql
EXPLAIN ANALYZE DELETE FROM usuarios WHERE ativo = false;
-- as linhas foram apagadas. de verdade.
```

O padrão seguro para analisar escrita:

```sql
BEGIN;
EXPLAIN ANALYZE UPDATE usuarios SET nome = 'x' WHERE id = 1;
ROLLBACK;   -- plano medido, dado intacto
```

### Anatomia de um plano (PostgreSQL)

```
Seq Scan on usuarios  (cost=0.00..20834.00 rows=200 width=45) (actual time=0.021..178.432 rows=200 loops=1)
                       └──────────┬────────┘ └───┬────┘         └──────────┬──────────┘ └───┬───┘ └───┬──┘
                            1. custo estimado  2. linhas EST.        3. tempo real    4. linhas REAIS  5. loops
  Filter: (nome ~~ '%ana%'::text)
  Rows Removed by Filter: 999800        ← 6. trabalho jogado no lixo
  Buffers: shared hit=8334 read=112     ← 7. blocos do cache / do disco
Planning Time: 0.112 ms
Execution Time: 178.501 ms
```

| # | Campo | Como interpretar |
|---|-------|------------------|
| 1 | `cost=0.00..20834.00` | Custo **estimado** de startup..total. Unidade arbitrária — **não é milissegundo**. Serve para comparar planos entre si, nunca para prever tempo. |
| 2 | `rows=200` (1º parêntese) | Quantas linhas o otimizador **acha** que virão |
| 3 | `actual time=0.021..178.432` | Tempo real até a 1ª linha .. até a última, **por loop** |
| 4 | `rows=200` (2º parêntese) | Quantas linhas **realmente** vieram |
| 5 | `loops=1` | Quantas vezes o nó rodou. **Multiplique** — `actual time` é por loop, não o total |
| 6 | `Rows Removed by Filter` | Linhas lidas e descartadas. O número que denuncia a varredura |
| 7 | `Buffers` | `shared hit` = veio do cache; `read` = foi ao disco. `read` alto explica lentidão intermitente |

### 🔑 As 3 perguntas que respondem 90% dos casos

1. **Tem varredura completa onde não deveria?** → `Seq Scan` / `TABLE ACCESS FULL` / `type: ALL` / `SCAN`
2. **Estimado e real divergem mais de 10x?** → estatísticas desatualizadas. O otimizador escolheu o plano com base numa mentira. Rode `ANALYZE` (PG) / `DBMS_STATS.GATHER_TABLE_STATS` (Oracle).
3. **Quantas linhas leu para devolver quantas?** → ler 1.000.000 para entregar 200 é um desperdício de **5000x**. Essa razão é o seu indicador.

> 💡 No PostgreSQL, `EXPLAIN (ANALYZE, BUFFERS)` deveria ser o default mental — sem `BUFFERS` você não distingue "lento porque leu muita coisa" de "lento porque foi ao disco". A partir do PG 18 o `BUFFERS` já vem ligado junto com `ANALYZE`.

### Mesma coisa, nome diferente em cada banco

O conceito é universal; só o vocabulário muda. Esta tabela é o tradutor:

| O que está acontecendo | PostgreSQL | MySQL | SQLite | Oracle | SQL Server |
|---|---|---|---|---|---|
| 🔴 Varredura completa | `Seq Scan` | `type: ALL` | `SCAN` | `TABLE ACCESS FULL` | `Table Scan` / `Clustered Index Scan` |
| 🟢 Busca por índice | `Index Scan` / `Bitmap Index Scan` | `type: ref` / `range` | `SEARCH ... USING INDEX` | `INDEX RANGE SCAN` | `Index Seek` |
| 🟡 Índice + volta na tabela | (embutido no `Index Scan`) | — | — | `TABLE ACCESS BY INDEX ROWID` | `Key Lookup` |
| 🟢 Índice cobre tudo | `Index Only Scan` | `Extra: Using index` | `USING COVERING INDEX` | `INDEX FAST FULL SCAN` | covering index (sem `Key Lookup`) |
| 🟡 Ordenação custosa | `Sort` (+ `Sort Method: external merge`) | `Extra: Using filesort` | `USE TEMP B-TREE FOR ORDER BY` | `SORT ORDER BY` | `Sort` |

### O comando em cada banco

| Banco | Plano estimado | Plano com números reais |
|-------|----------------|--------------------------|
| **PostgreSQL** | `EXPLAIN <sql>` | `EXPLAIN (ANALYZE, BUFFERS) <sql>` |
| **MySQL 8.0.18+** | `EXPLAIN FORMAT=TREE <sql>` | `EXPLAIN ANALYZE <sql>` |
| **MySQL < 8.0.18** | `EXPLAIN <sql>` | ❌ não existe — use `SHOW STATUS LIKE 'Handler_read%'` |
| **MariaDB** | `EXPLAIN <sql>` | `ANALYZE FORMAT=JSON <sql>` |
| **SQLite** | `EXPLAIN QUERY PLAN <sql>` | ❌ não existe — use `.timer on` |
| **SQL Server** | `SET SHOWPLAN_TEXT ON` | `SET STATISTICS PROFILE ON` + `SET STATISTICS IO, TIME ON` |
| **Oracle** | `EXPLAIN PLAN FOR` + `DBMS_XPLAN.DISPLAY` | hint `GATHER_PLAN_STATISTICS` + `DBMS_XPLAN.DISPLAY_CURSOR` |

---

### 🟦 SQLite — `EXPLAIN QUERY PLAN`

> ✅ **Executado nesta máquina** (SQLite 3.50, tabela com 50.001 linhas e índice em `nome`).

```sql
EXPLAIN QUERY PLAN SELECT * FROM usuarios WHERE nome LIKE '%ana%';
EXPLAIN QUERY PLAN SELECT * FROM usuarios WHERE nome LIKE 'Mari%';
EXPLAIN QUERY PLAN SELECT * FROM usuarios WHERE nome = 'Mariana Souza';
```

```
%ana%             -> SCAN usuarios                                         ← esperado
Mari%             -> SCAN usuarios                                         ← 😱 inesperado!
= 'Mariana Souza' -> SEARCH usuarios USING COVERING INDEX idx_nome (nome=?)
```

O `LIKE 'Mari%'` é prefixo puro — deveria usar o índice, e não usou. A causa é a mesma armadilha do `text_pattern_ops` no PostgreSQL, com outra roupagem: o `LIKE` do SQLite é **case-insensitive** por padrão, mas o índice é ordenado por `BINARY` (case-sensitive). O otimizador não pode usar um índice cuja ordem não corresponde à semântica da comparação. Verificado — qualquer uma das duas correções resolve:

| Correção | Plano resultante |
|---|---|
| `PRAGMA case_sensitive_like = ON` | `SEARCH u USING COVERING INDEX idx (nome>? AND nome<?)` ✅ |
| `CREATE INDEX idx ON u(nome COLLATE NOCASE)` | `SEARCH u USING COVERING INDEX idx (nome>? AND nome<?)` ✅ |
| Nenhuma | `SCAN u` ❌ |

E, confirmando a regra geral: mesmo com `COLLATE NOCASE`, o `LIKE '%ana%'` continua `SCAN u`. **Nenhum ajuste de collation salva o `%` à esquerda.**

---

### 🔶 Oracle — o `EXPLAIN ANALYZE` que não se chama assim

Oracle é o caso que mais confunde, porque o comando de nome parecido **não faz** o que você espera.

#### 1. `EXPLAIN PLAN FOR` — o caminho popular (e enganoso)

```sql
EXPLAIN PLAN FOR
SELECT * FROM usuarios WHERE nome LIKE '%ana%';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
```

```
--------------------------------------------------------------------------
| Id  | Operation          | Name     | Rows  | Bytes | Cost  | Time     |
--------------------------------------------------------------------------
|   0 | SELECT STATEMENT   |          |   200 |  9000 |  1523 | 00:00:01 |
|*  1 |  TABLE ACCESS FULL | USUARIOS |   200 |  9000 |  1523 | 00:00:01 |
--------------------------------------------------------------------------
Predicate Information (identified by operation id):
   1 - filter("NOME" LIKE '%ana%')
```

> ⚠️ **Isto é o `EXPLAIN`, não o `EXPLAIN ANALYZE`.** Nada foi executado, **todos** os números são estimativa, e — o mais perigoso — ele não faz *bind peeking*: com bind variables, o plano exibido pode simplesmente **não ser** o plano que roda em produção.

#### 2. O equivalente real: `GATHER_PLAN_STATISTICS` + `DISPLAY_CURSOR`

```sql
SET SERVEROUTPUT OFF          -- senão o "último cursor" vira o do DBMS_OUTPUT
SET LINESIZE 200 PAGESIZE 100

SELECT /*+ GATHER_PLAN_STATISTICS */ *
FROM usuarios WHERE nome LIKE '%ana%';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR(NULL, NULL, 'ALLSTATS LAST'));
```

```
-------------------------------------------------------------------------------------------
| Id  | Operation          | Name     | Starts | E-Rows | A-Rows |   A-Time   | Buffers |
-------------------------------------------------------------------------------------------
|   0 | SELECT STATEMENT   |          |      1 |        |    200 |00:00:00.18 |    8334 |
|*  1 |  TABLE ACCESS FULL | USUARIOS |      1 |    200 |    200 |00:00:00.18 |    8334 |
-------------------------------------------------------------------------------------------
```

Agora sim há colunas `E-Rows` (**E**stimated) **e** `A-Rows` (**A**ctual) lado a lado — que é exatamente a comparação que o PostgreSQL entrega. O tradutor mental:

| PostgreSQL | Oracle | Significa |
|---|---|---|
| `rows=` (1º parêntese) | `E-Rows` | estimativa do otimizador |
| `actual ... rows=` | `A-Rows` | linhas reais |
| `actual time=` | `A-Time` | tempo real |
| `loops=` | `Starts` | quantas vezes o nó executou |
| `Buffers: shared hit` | `Buffers` | blocos lidos (`consistent gets`) |

> 🔑 A regra de ouro do Oracle é a mesma: **`E-Rows` muito diferente de `A-Rows` = plano ruim garantido.** Comece a investigação sempre pelo nó mais fundo onde a divergência aparece — o erro se propaga para cima.

**Alternativa ao hint** (vale para a sessão inteira, mas é mais pesado):

```sql
ALTER SESSION SET STATISTICS_LEVEL = ALL;
```

**Pré-requisito:** o usuário precisa de `SELECT` em `V$SESSION`, `V$SQL_PLAN` e `V$SQL_PLAN_STATISTICS_ALL` — na prática, `SELECT_CATALOG_ROLE`. Sem isso o `DISPLAY_CURSOR` devolve *"cannot fetch plan for SQL_ID"*.

#### 3. `AUTOTRACE` — o atalho no SQL*Plus / SQLcl

```sql
SET AUTOTRACE ON
SELECT * FROM usuarios WHERE nome LIKE '%ana%';
```

Traz plano + estatísticas de execução. O número que interessa é **`consistent gets`** — é o `Buffers` do Oracle. Milhares de `consistent gets` para devolver 200 linhas é o mesmo diagnóstico do `Rows Removed by Filter` no PostgreSQL.

#### 4. SQL Monitor — para query longa ou paralela

```sql
SELECT DBMS_SQLTUNE.REPORT_SQL_MONITOR(sql_id => 'abc123xyz', type => 'ACTIVE') FROM dual;
```

Dispara automaticamente para queries acima de ~5s ou em paralelo, e mostra o plano **enquanto ainda está rodando**.

> ⚠️ **Licença:** exige Diagnostics + Tuning Pack (opção paga do Enterprise Edition). O uso é registrado em `DBA_FEATURE_USAGE_STATISTICS` e **aparece em auditoria da Oracle**. Confirme a licença do cliente antes de rodar — as duas primeiras opções são gratuitas e resolvem quase tudo.

#### 5. Busca "inteligente" no Oracle

O `LIKE '%ana%'` faz `TABLE ACCESS FULL` — mesma história de sempre. As saídas nativas:

```sql
-- Oracle Text: o FTS do Oracle
CREATE INDEX idx_nome_txt ON usuarios(nome)
  INDEXTYPE IS CTXSYS.CONTEXT
  PARAMETERS ('SYNC (ON COMMIT)');

SELECT nome, SCORE(1) AS relevancia
FROM usuarios
WHERE CONTAINS(nome, 'ana', 1) > 0
ORDER BY SCORE(1) DESC;

-- fuzzy nativo (tolera erro de digitação)
SELECT nome FROM usuarios
WHERE CONTAINS(nome, 'FUZZY(mariana, 70, 100, weight)', 1) > 0;

-- distância de edição — NÃO indexável, só sobre conjunto pequeno
SELECT nome FROM usuarios WHERE UTL_MATCH.EDIT_DISTANCE(nome, 'calsa') <= 2;
```

> 🪤 **A maior pegadinha do Oracle Text:** o índice `CONTEXT` **não é transacional**. Sem o `SYNC (ON COMMIT)`, uma linha inserida **não aparece na busca** até alguém rodar `CTX_DDL.SYNC_INDEX('IDX_NOME_TXT')`. Em produção isso vira o chamado clássico *"cadastrei o produto e ele não aparece na busca"* — e o desenvolvedor procura o bug na aplicação por dois dias. Mesmo com `ON COMMIT`, o índice **fragmenta** com o tempo e precisa de `CTX_DDL.OPTIMIZE_INDEX` periódico.

Para case e acento, o Oracle resolve por *linguistic comparison*:

```sql
ALTER SESSION SET NLS_COMP = LINGUISTIC;
ALTER SESSION SET NLS_SORT = BINARY_AI;   -- AI = Accent Insensitive (BINARY_CI = Case Insensitive)

-- para indexar de acordo:
CREATE INDEX idx_nome_ai ON usuarios (NLSSORT(nome, 'NLS_SORT=BINARY_AI'));
```

#### 6. Subir um Oracle para testar

```bash
docker run -d --name oratest -p 1521:1521 -e ORACLE_PASSWORD=oracle gvenzl/oracle-free:slim
docker exec -it oratest sqlplus system/oracle@//localhost:1521/FREEPDB1
```

```sql
CREATE TABLE usuarios (
  id   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome VARCHAR2(200),
  bio  VARCHAR2(400)
);

INSERT INTO usuarios (nome, bio)
SELECT CASE MOD(LEVEL, 5000)
         WHEN 0 THEN 'Mariana Souza ' || LEVEL
         WHEN 1 THEN 'Ana Paula '     || LEVEL
         ELSE         'Usuario '      || LEVEL
       END,
       'Perfil numero ' || LEVEL
FROM dual CONNECT BY LEVEL <= 200000;
COMMIT;

EXEC DBMS_STATS.GATHER_TABLE_STATS(USER, 'USUARIOS');
```

> 💡 `CONNECT BY LEVEL` é o `generate_series` do Oracle. Se subir muito o valor e tomar `ORA-30009: insufficient memory for CONNECT BY`, gere em lotes menores.

Agora repita o passo 2 e compare `E-Rows` com `A-Rows`.

**Limpeza:** `docker rm -f oratest`

> ℹ️ As saídas Oracle acima são **ilustrativas** — não foram executadas nesta máquina (sem instância disponível). Os comandos estão corretos; os números variam por ambiente.

---

## 🧪 Como testar rápido

### 🥇 Teste 1 — SQLite, 30 segundos, sem instalar nada

Prova as diferenças de case, acento e stemming. **Todos os resultados abaixo foram executados de verdade** (Python 3.13 / SQLite 3.50):

```python
import sqlite3
c = sqlite3.connect(":memory:")

# --- LIKE: case e acento ---
c.execute("CREATE TABLE u(nome TEXT)")
c.executemany("INSERT INTO u VALUES (?)",
              [("Mariana Souza",), ("Ana Paula",), ("Ângela Costa",)])

for q in ["%ana%", "%ANA%", "%angela%"]:
    r = c.execute("SELECT nome FROM u WHERE nome LIKE ?", (q,)).fetchall()
    print(q, "->", [x[0] for x in r])
```

```
%ana%     -> ['Mariana Souza', 'Ana Paula']   ← case-insensitive (ASCII)
%ANA%     -> ['Mariana Souza', 'Ana Paula']
%angela%  -> []                               ← acento NÃO é ignorado
```

```python
# --- FTS5: stemming ---
c.execute("CREATE VIRTUAL TABLE t USING fts5(bio)")                       # sem stemmer
c.execute("CREATE VIRTUAL TABLE tp USING fts5(bio, tokenize='porter unicode61')")
for tbl in ("t", "tp"):
    c.executemany(f"INSERT INTO {tbl} VALUES (?)",
                  [("gosta de correr",), ("saiu correndo",), ("vende camisas",)])

for tbl in ("t", "tp"):
    for q in ["camisa", "correr", "correndo"]:
        r = c.execute(f"SELECT bio FROM {tbl} WHERE {tbl} MATCH ?", (q,)).fetchall()
        print(tbl, q, "->", [x[0] for x in r])
```

```
t  camisa    -> []                   ← sem stemmer: 'camisa' NÃO acha 'camisas'
t  correr    -> ['gosta de correr']
t  correndo  -> ['saiu correndo']
tp camisa    -> ['vende camisas']    ← porter resolve o plural
tp correr    -> ['gosta de correr']
tp correndo  -> ['saiu correndo']    ← mas NÃO unifica o verbo em português
```

> 🔑 **A lição:** `porter` é um stemmer **de inglês**. Ele acerta o plural em `-s` por coincidência, mas não conjuga verbos em português. Stemming errado = FTS que parece funcionar e falha nos casos que importam.

Bônus — acento no FTS5 é controlado pelo tokenizer (verificado):

| Tokenizer | `MATCH 'angela'` acha `Ângela`? |
|-----------|--------------------------------|
| `unicode61` (padrão) | ✅ Sim — remove acentos |
| `unicode61 remove_diacritics 0` | ❌ Não |

> ⚠️ Repare na inversão: no SQLite o **FTS ignora acento** mas o **`LIKE` não**. Buscar dos dois jeitos na mesma tela dá resultados diferentes para o mesmo termo.

---

### 🥈 Teste 2 — PostgreSQL: provar o Seq Scan e matá-lo

> ℹ️ Não executado nesta máquina (Docker parado) — saídas marcadas como **esperadas**. Os números variam por hardware.

```bash
docker run --rm -d --name pgtest -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
docker exec -it pgtest psql -U postgres
```

**Seed de 1 milhão de linhas:**

```sql
CREATE TABLE usuarios (id serial PRIMARY KEY, nome text, bio text);

INSERT INTO usuarios (nome, bio)
SELECT
  CASE i % 5000
    WHEN 0 THEN 'Mariana Souza ' || i
    WHEN 1 THEN 'Ana Paula '     || i
    WHEN 2 THEN 'Ângela Costa '  || i
    ELSE         'Usuario '      || i
  END,
  CASE WHEN i % 5000 = 0 THEN 'Vende camisas azuis e sai correndo'
       ELSE 'Perfil numero ' || i END
FROM generate_series(1, 1000000) i;

ANALYZE usuarios;
```

**Passo 1 — o problema:**

```sql
EXPLAIN ANALYZE SELECT * FROM usuarios WHERE nome LIKE '%ana%';
```

```
Seq Scan on usuarios  (rows=200)                    ← esperado
  Filter: (nome ~~ '%ana%'::text)
  Rows Removed by Filter: 999800
Execution Time: ~180 ms
```

👉 Leu **1.000.000 de linhas** para devolver 200. E note: só achou `Mariana` — `Ana Paula` ficou de fora porque `LIKE` no PostgreSQL é case-sensitive.

**Passo 2 — o índice B-tree comum não ajuda:**

```sql
CREATE INDEX idx_nome ON usuarios (nome);
EXPLAIN ANALYZE SELECT * FROM usuarios WHERE nome LIKE '%ana%';
-- Seq Scan de novo. O índice existe e é simplesmente ignorado.
```

**Passo 3 — trigram resolve:**

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_nome_trgm ON usuarios USING gin (nome gin_trgm_ops);

EXPLAIN ANALYZE SELECT * FROM usuarios WHERE nome ILIKE '%ana%';
```

```
Bitmap Heap Scan on usuarios  (rows=400)            ← esperado
  -> Bitmap Index Scan on idx_nome_trgm
Execution Time: ~2 ms                               ← ~90x mais rápido
```

👉 Mesma query, `ILIKE` agora indexado, e achando `Ana Paula` também.

**Passo 4 — acento:**

```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
SELECT count(*) FROM usuarios WHERE nome ILIKE '%angela%';                    -- 0
SELECT count(*) FROM usuarios WHERE unaccent(nome) ILIKE unaccent('%angela%');-- 200
```

> ⚠️ `unaccent()` é declarada `STABLE`, não `IMMUTABLE` — logo **não pode ir direto** num índice ou coluna gerada. É preciso um wrapper:
> ```sql
> CREATE FUNCTION f_unaccent(text) RETURNS text AS $$
>   SELECT public.unaccent('public.unaccent', $1)
> $$ LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE;
>
> CREATE INDEX idx_nome_unaccent ON usuarios USING gin (f_unaccent(nome) gin_trgm_ops);
> ```
> Sem o wrapper o `CREATE INDEX` falha com *"functions in index expression must be marked IMMUTABLE"*.

**Passo 5 — Full-Text Search com stemming em português:**

```sql
ALTER TABLE usuarios ADD COLUMN busca tsvector
  GENERATED ALWAYS AS (to_tsvector('portuguese', coalesce(bio, ''))) STORED;

CREATE INDEX idx_busca ON usuarios USING gin (busca);

-- 'camisa' no singular acha 'camisas'; 'correr' acha 'correndo'
SELECT nome, ts_rank(busca, q) AS relevancia
FROM usuarios, plainto_tsquery('portuguese', 'camisa azul') q
WHERE busca @@ q
ORDER BY relevancia DESC
LIMIT 10;
```

Confirme o stemming direto, sem tabela:

```sql
SELECT to_tsvector('portuguese', 'camisas azuis correndo');
-- esperado: 'azul':2 'camis':1 'corr':3      ← radicais, não as palavras
```

> 💡 Use `websearch_to_tsquery` (PG 11+) para input de usuário — aceita `"aspas"`, `-exclusão` e `or` sem estourar erro de sintaxe, ao contrário de `to_tsquery`.

**Limpeza:** `docker rm -f pgtest`

---

### 🥉 Teste 3 — MySQL: `FULLTEXT` + `MATCH ... AGAINST`

> ℹ️ Não executado nesta máquina — saídas **esperadas**.

```bash
docker run --rm -d --name mytest -e MYSQL_ROOT_PASSWORD=root -p 3306:3306 mysql:8
docker exec -it mytest mysql -uroot -proot
```

```sql
CREATE DATABASE teste; USE teste;

CREATE TABLE produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(200),
  descricao TEXT,
  FULLTEXT KEY ft_busca (nome, descricao)
) ENGINE=InnoDB;

INSERT INTO produtos (nome, descricao) VALUES
 ('Camisa Polo Azul', 'Camisas de algodao para o verao'),
 ('Calça Jeans',      'Calcas resistentes'),
 ('Tênis Corrida',    'Ideal para correr no parque');

-- 1) LIKE não acha o plural invertido
SELECT nome FROM produtos WHERE nome LIKE '%camisas%';        -- 0 linhas

-- 2) FTS acha, e ordena por relevância
SELECT nome, MATCH(nome, descricao) AGAINST('camisas') AS score
FROM produtos
WHERE MATCH(nome, descricao) AGAINST('camisas' IN NATURAL LANGUAGE MODE)
ORDER BY score DESC;

-- 3) BOOLEAN MODE: operadores e prefixo
SELECT nome FROM produtos
WHERE MATCH(nome, descricao) AGAINST('+camisa -jeans' IN BOOLEAN MODE);

SELECT nome FROM produtos
WHERE MATCH(nome, descricao) AGAINST('camis*' IN BOOLEAN MODE);
```

**Três pegadinhas do MySQL que valem anotar:**

| Pegadinha | Detalhe |
|-----------|---------|
| Tamanho mínimo do token | InnoDB indexa a partir de **3 caracteres** (`innodb_ft_min_token_size`). Buscar `TV` ou `PC` retorna **zero** — e não é bug. |
| Sem stemmer de português | O MySQL não tem stemming nativo. `camisa` **não** acha `camisas` — só `camis*` em BOOLEAN MODE resolve. É a maior diferença para o PostgreSQL. |
| Collation esconde o problema | Com `utf8mb4_0900_ai_ci` (padrão do MySQL 8), `LIKE` já ignora case **e** acento. Seu código funciona no MySQL e quebra ao migrar para PostgreSQL. |

**Limpeza:** `docker rm -f mytest`

---

## ⚠️ Checklist antes de subir uma busca para produção

- [ ] Rodei `EXPLAIN ANALYZE` com **volume realista** de dados, não com 20 linhas de seed
- [ ] O plano mostra uso de índice — não `Seq Scan` / `TABLE ACCESS FULL` / `type: ALL` / `SCAN`
- [ ] Conferi **estimado vs real** (`rows` vs `actual rows`, ou `E-Rows` vs `A-Rows`) — divergência > 10x = estatísticas desatualizadas
- [ ] Olhei a razão **linhas lidas ÷ linhas devolvidas** (`Rows Removed by Filter` / `consistent gets`)
- [ ] Escapei `%` e `_` do input do usuário (`ESCAPE`) — senão um `%` varre a tabela
- [ ] Defini o comportamento esperado para **acento** e **maiúsculas**, e testei os dois
- [ ] Há `LIMIT` **e** um `statement_timeout` — a busca não pode rodar por 30s
- [ ] Autocomplete tem *debounce* no front (300ms) e mínimo de 3 caracteres
- [ ] O dicionário do FTS é `'portuguese'`, não o `'english'` default
- [ ] Medi o impacto do índice GIN na **escrita** (INSERT/UPDATE ficam mais lentos e o disco cresce)
- [ ] No MySQL: o `MATCH()` lista **exatamente** as colunas do índice `FULLTEXT`, e defini se quero `OR` (natural) ou `AND` (`+termo` em BOOLEAN MODE)
- [ ] Nenhuma coluna indexada está dentro de função no `WHERE` — senão preciso de índice funcional
- [ ] Criar o índice em tabela grande foi planejado como **janela de manutenção**, não deploy comum
- [ ] A busca cai de forma isolada — o pool de conexões dela não é o mesmo do checkout

---

## 📚 Referências

- [PostgreSQL — Full Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [PostgreSQL — `pg_trgm`](https://www.postgresql.org/docs/current/pgtrgm.html) · [`unaccent`](https://www.postgresql.org/docs/current/unaccent.html)
- [MySQL — Full-Text Search Functions](https://dev.mysql.com/doc/refman/8.0/en/fulltext-search.html)
- [SQLite — FTS5](https://www.sqlite.org/fts5.html) · [`EXPLAIN QUERY PLAN`](https://www.sqlite.org/eqp.html) · [Otimização do LIKE](https://www.sqlite.org/optoverview.html#the_like_optimization)
- [Use The Index, Luke — LIKE e índices](https://use-the-index-luke.com/sql/where-clause/searching-for-ranges/like-performance-tuning)

**Plano de execução:**

- [PostgreSQL — `EXPLAIN`](https://www.postgresql.org/docs/current/sql-explain.html) · [Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
- [MySQL — `EXPLAIN ANALYZE`](https://dev.mysql.com/doc/refman/8.0/en/explain.html#explain-analyze)
- [Oracle — `DBMS_XPLAN`](https://docs.oracle.com/en/database/oracle/oracle-database/23/arpls/DBMS_XPLAN.html) · [Guia de tuning: lendo planos](https://docs.oracle.com/en/database/oracle/oracle-database/23/tgsql/generating-and-displaying-execution-plans.html)
- [Oracle Text — `CONTAINS`](https://docs.oracle.com/en/database/oracle/oracle-database/23/ccref/oracle-text-CONTAINS-query-operators.html)
- [SQL Server — `SET STATISTICS PROFILE`](https://learn.microsoft.com/en-us/sql/t-sql/statements/set-statistics-profile-transact-sql)

**Ferramentas para visualizar planos:**

- [explain.dalibo.com](https://explain.dalibo.com/) e [explain.depesz.com](https://explain.depesz.com/) — colam o output do PostgreSQL e destacam o nó problemático
