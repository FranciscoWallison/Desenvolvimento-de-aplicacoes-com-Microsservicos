# 🔎 Buscas Inteligentes no Banco de Dados

> **Tema:** por que `LIKE '%ana%'` quebra em produção e o que usar no lugar
> **Base:** [sql-basico.md](sql-basico.md)
> **Cobre:** `LIKE`/`ILIKE` → Full-Text Search → busca fuzzy (trigram) → quando sair para um motor dedicado

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
- [ ] O plano mostra uso de índice — não `Seq Scan` / `type: ALL`
- [ ] Escapei `%` e `_` do input do usuário (`ESCAPE`) — senão um `%` varre a tabela
- [ ] Defini o comportamento esperado para **acento** e **maiúsculas**, e testei os dois
- [ ] Há `LIMIT` **e** um `statement_timeout` — a busca não pode rodar por 30s
- [ ] Autocomplete tem *debounce* no front (300ms) e mínimo de 3 caracteres
- [ ] O dicionário do FTS é `'portuguese'`, não o `'english'` default
- [ ] Medi o impacto do índice GIN na **escrita** (INSERT/UPDATE ficam mais lentos e o disco cresce)
- [ ] A busca cai de forma isolada — o pool de conexões dela não é o mesmo do checkout

---

## 📚 Referências

- [PostgreSQL — Full Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [PostgreSQL — `pg_trgm`](https://www.postgresql.org/docs/current/pgtrgm.html) · [`unaccent`](https://www.postgresql.org/docs/current/unaccent.html)
- [MySQL — Full-Text Search Functions](https://dev.mysql.com/doc/refman/8.0/en/fulltext-search.html)
- [SQLite — FTS5](https://www.sqlite.org/fts5.html)
- [Use The Index, Luke — LIKE e índices](https://use-the-index-luke.com/sql/where-clause/searching-for-ranges/like-performance-tuning)
