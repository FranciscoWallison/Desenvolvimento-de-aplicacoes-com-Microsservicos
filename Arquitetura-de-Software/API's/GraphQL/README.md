# Guia prático de performance e escalabilidade em GraphQL

## 1) Contexto

APIs GraphQL que atendem **múltiplos clientes** (web, mobile, parceiros) costumam sofrer com:

* Queries cada vez mais **complexas** (campos profundamente aninhados, listas dentro de listas).
* **Latência** alta e **picos de CPU** no servidor.
* Custo elevado em **agregações** (counts, sums, métricas) e em **paginação profunda**.

O desafio é **manter flexibilidade** (cliente escolhe os campos) sem deixar uma query “explodir” o backend.

---

## 2) Causas raiz mais comuns

### 2.1) N+1 (o clássico)

Quando um resolver busca dados item-a-item:

* Você pede `users { posts { comments { author { ... } } } }`
* E o servidor faz centenas/milhares de chamadas ao banco/serviços.

Isso aumenta:

* **latência** (muitas viagens de ida/volta)
* **CPU** (overhead de parsing, serialização, pool de conexões)
* **carga no banco**

### 2.2) “Explosão combinatória” por listas aninhadas

Listas dentro de listas multiplicam o trabalho:

* `users(first: 100) -> posts(first: 50) -> comments(first: 50)`
* Pior caso: 100 * 50 * 50 = 250k nós potenciais para resolver.

### 2.3) Agregações caras

`totalCount`, `sum`, `groupBy`, `search` com filtros complexos e joins, principalmente repetidos em subárvores.

### 2.4) Paginação profunda (offset alto / cursor mal usado)

* Offset grande pode obrigar o banco a “andar” milhões de linhas.
* Cursor mal desenhado pode gerar consultas instáveis (ou caras).

---

## 3) Padrões que mais impactam performance (prioridade)

### 3.1) DataLoader (batching + cache por requisição)

**O que resolve:** N+1 e repetição de fetch no mesmo request.

**Como funciona:**

* Agrupa múltiplas leituras por chave em uma única consulta (batch).
* Cacheia resultados **apenas durante a vida da requisição**.

**Boas práticas:**

* Criar loaders **por request** (não global) para evitar vazamento de cache entre usuários.
* Um loader por “tipo de acesso”:

  * `userByIdLoader`
  * `postsByUserIdLoader`
  * `productBySkuLoader`
* Garantir que o batch faz uma consulta do tipo `WHERE id IN (...)`.
* Cuidado com chaves compostas (use chave serializada estável, ex.: `tenantId:id`).

**Anti-padrões:**

* Instanciar DataLoader global (cache compartilhado entre requests).
* Dar `await` em loop e quebrar batching (depende da implementação; em geral, carregue e deixe o batch acontecer no mesmo “tick”).

### 3.2) Limite de complexidade e profundidade (Query Cost Analysis + Depth Limit)

**O que resolve:** queries “pesadas” demais que explodem CPU/latência.

**Ideia:**

* Antes de executar, calcular um **custo estimado**:

  * Peso por campo (barato vs caro)
  * Multiplicador por listas (`first`, `limit`)
  * Penalidade por agregações e filtros caros
* Rejeitar ou degradar queries acima do limite.

**Práticas recomendadas:**

* `MAX_DEPTH` (ex.: 8–12)
* `MAX_COST` (ex.: 10.000) e custo por lista proporcional a `first`.
* Teto obrigatório de `first` (ex.: no máximo 100).
* Orçamentos por cliente/credencial (mobile < web < parceiros contratados).

> Isso mantém a flexibilidade: o cliente escolhe campos, mas dentro de um “orçamento”.

### 3.3) Paginação consistente (Connection/Cursor) + limites

**O que resolve:** página grande + offset profundo + listas aninhadas.

**Regras úteis:**

* Preferir cursor (Relay Connection) em vez de offset.
* Impor `maxPageSize` (ex.: 50/100).
* Em subcoleções aninhadas, ser ainda mais agressivo (ex.: comentários max 20).

### 3.4) Agregações: separar, pré-agregar, e cachear

**O que resolve:** custo alto repetido.

Padrões práticos:

* Evitar recalcular agregações em subárvores repetidas.
* Ter resolvers específicos para agregados (ex.: `UserStats`, `OrderSummary`).
* Quando faz sentido, usar:

  * views/materialized views
  * tabelas de contagem
  * caches de resultados (com TTL/invalidations)

---

## 4) Otimizações complementares (úteis, mas não substituem os itens acima)

### 4.1) Persisted Queries (APQ)

**Ajuda em:**

* Reduzir custo de parsing/validação.
* Evitar queries arbitrárias em ambientes controlados.
* Possibilitar cache por “id de query”.

**Limitação:** não resolve N+1 nem custo de banco por si só.

### 4.2) Cache

**Tipos comuns:**

* **Cache por request** (DataLoader): essencial.
* **Cache de resposta** (CDN/edge): bom para queries públicas/sem personalização.
* **Cache por campo** (ex.: resolvers caros com TTL curto): ótimo para métricas e catálogos.

**Cuidados:**

* Personalização por usuário → cache precisa de chave correta (ex.: user/tenant/roles).
* Invalidations são o “inferno”: defina bem o que pode ter TTL.

### 4.3) @defer e @stream

**Ajuda em:**

* Entregar “rápido o essencial” e carregar o resto depois (melhora UX/percepção).

**Limitação:**

* Não reduz o trabalho total do backend; só muda a forma de entrega.

### 4.4) Schema composition (stitching/federation)

**Serve para:** arquitetura (múltiplos serviços), ownership, times.

**Não é** um padrão primário de performance de query individual.

---

## 5) Observabilidade (sem isso você só chuta)

### 5.1) Métricas essenciais

* Latência p50/p95/p99 por operação
* Erros por operação
* CPU/memória do gateway GraphQL
* Tempo e contagem de chamadas a banco/serviços por request

### 5.2) Tracing por resolver

* Tempo de cada field resolver
* Quantidade de hits do DataLoader (batch size, cache hit rate)

### 5.3) Log de “queries caras”

* Registrar custo calculado, depth, e top campos mais caros.
* Amostrar (sampling) para não explodir volume.

---

## 6) Playbook de mitigação (ordem prática)

1. **DataLoader** (corrige N+1 e reduz chamadas)
2. **Limite de profundidade + custo** (impede explosões)
3. **Paginação com limites** (corta multiplicação por listas)
4. **Ajustes de agregação** (pré-agregar/cachear quando necessário)
5. **Persisted queries** (opcional, melhora parsing e governança)
6. **Cache de campo/edge** onde for seguro
7. **@defer/@stream** se UX justificar

---

## 7) Checklist rápido (para revisão de PR / arquitetura)

### DataLoader

* [ ] Loaders são criados por request
* [ ] Batch usa `IN (...)` ou endpoint batch real
* [ ] Cache por request está ativo
* [ ] Chaves compostas tratadas corretamente

### Proteções de query

* [ ] `MAX_DEPTH` configurado
* [ ] `MAX_COST` configurado
* [ ] Teto de `first` (e defaults) aplicado
* [ ] Custos mais altos para agregações e campos caros

### Paginação

* [ ] Cursor pagination preferida
* [ ] `first` obrigatório e limitado
* [ ] Subcoleções com limites menores

### Agregações

* [ ] Agregados críticos pré-computados ou cacheados com TTL
* [ ] Evita recalcular agregados em subárvores

### Observabilidade

* [ ] Tracing por resolver
* [ ] Métricas p95/p99 por operação
* [ ] Log de queries caras (sampling)

---

## 8) Mini-exemplo de decisão (quando você vê o problema)

**Sintoma:** p99 sobe quando pedem campos aninhados e lista grande.

* Primeiro suspeito: **N+1** → DataLoader.
* Segundo: **explosão por listas** → limites de paginação e custo.
* Terceiro: **agregações repetidas** → pré-agregar/cachear.

---

## 9) Resultado esperado

Com DataLoader + limites de custo/profundidade + paginação bem definida:

* Cai o número de chamadas ao backend/banco.
* CPU do servidor GraphQL estabiliza.
* p95/p99 melhoram e ficam previsíveis.
* Cliente mantém flexibilidade (com “orçamento” e limites claros).

