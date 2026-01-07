# Rate limiting em APIs críticas: adaptativo por cliente e armazenamento resiliente de contadores

Este doc resume e aprofunda **duas situações**:

1. Como mitigar um cliente bugado que dispara tráfego absurdo sem prejudicar clientes bons.
2. Em ambiente distribuído, qual é a forma **mais resiliente** de armazenar contadores de rate limit.

---

## 1) Incidente: cliente bugado disparando milhares de RPS em um endpoint

### Cenário

* API de pagamentos/alta criticidade.
* Um cliente com bug começou a enviar **milhares de requisições por segundo** a um endpoint.
* Existe rate limit global, mas **não segurou o impacto** (outros serviços ficaram lentos/instáveis).

### Objetivo

Conter o “mal-comportado” **sem impactar** clientes bem-comportados.

### Estratégia priorizada

**Rate limiting adaptativo por cliente** (e por rota), com limites dinâmicos e penalidades.

#### Por que isso funciona

* O problema é **localizado**: um cliente/endereço lógico (API key/consumer/account) está causando dano.
* Rate limit global é cego: ele não diferencia “quem” está causando o estrago.
* Adaptativo permite:

  * identificar anomalias
  * reduzir rapidamente o orçamento de quem está fora do padrão
  * aplicar penalidade progressiva

### Design recomendado

#### (1) Chave correta

Use rate limit por:

* `client_id` (API key / consumer) + `endpoint`
  Opcional:
* `method`
* `tenant`
* `region`

Exemplo de chave:

* `rl:{client_id}:{endpoint}:{window}`

#### (2) Algoritmo

* **Token Bucket** (recomendado): permite burst pequeno e limita sustentado.
* **Leaky Bucket**: controla taxa com fila/escorrimento.
* **Fixed window**: simples, mas sofre com boundary (pico na virada).

#### (3) Penalidade progressiva (o que salva em incidente)

Quando o cliente estoura repetidamente:

* responder `429 Too Many Requests`
* enviar `Retry-After`
* aumentar tempo de cooldown progressivamente

  * 10s → 1m → 10m
* se persistir: bloqueio temporário do par `client_id + endpoint`

#### (4) Limites por classe de endpoint

Em pagamentos, não trate tudo igual:

* endpoints de criação/execução (ex.: `charge`, `capture`) → limites mais conservadores
* endpoints de leitura/status → limites maiores

#### (5) Observabilidade e automação

* detectar “cliente X subiu 20x em 2 min”
* alertar e/ou acionar mitigação automática (penalidade)

### Por que as alternativas comuns falham

* Aumentar limite global: piora o estrago.
* Rate limit por IP: NAT/CDN/egress compartilhado derruba clientes bons.
* Reduzir limite para todos: punição coletiva.

---

## 2) Onde armazenar contadores de rate limiting em ambiente distribuído

### Cenário

* API distribuída (várias instâncias/escala horizontal).
* Precisa de **consistência suficiente** para não “furar” limite.
* Precisa de **alta disponibilidade** e baixa latência.

### Abordagem priorizada

**Cache distribuído com atomicidade e replicação**.

O padrão de mercado:

* **Redis** (Cluster/Sentinel) com `INCR`/`EXPIRE` e/ou scripts Lua
* ou outro KV que forneça contador atômico + HA

> Nota: Memcached é rápido, mas costuma ser escolha pior para rate limiting “forte” em HA por limitações de consistência/replicação/cluster dependendo do setup.

### Por que é a melhor escolha

* Contador compartilhado entre instâncias → evita “cada nó conta uma coisa”.
* Operações atômicas (`INCR`) → evita race conditions.
* TTL nativo → fácil expirar janelas.
* Replicação/failover → falha de nó não derruba o rate limiting.

### Por que as alternativas são ruins

#### A) Contador em memória local

* Cada instância aplica limite diferente.
* Cliente distribui tráfego entre nós e **fura** o limite.

#### B) Banco relacional

* Contenção/locks em alto volume.
* Latência maior e gargalo central.
* Escala mais difícil para contador hot-spot.

#### C) Sincronizar via mensagens

* Consistência eventual.
* Pode “passar” tráfego excessivo no atraso de propagação.
* Complexidade operacional alta.

---

## 3) Padrões de implementação (práticos)

### 3.1) Fixed window (simples)

* Chave por janela: `rl:{client}:{endpoint}:{yyyyMMddHHmm}`
* `INCR` e `EXPIRE` (TTL um pouco maior que a janela)

**Prós:** simples
**Contras:** pico na virada (window boundary)

### 3.2) Sliding window (mais suave)

* contagem aproximada com duas janelas (atual/anterior) ou logs

**Prós:** mais justo
**Contras:** mais caro/complexo

### 3.3) Token bucket via Lua (recomendado)

* Um script Lua garante atomicidade: calcula tokens, repõe, consome
* Dá controle fino e bom comportamento sob burst

---

## 4) Estratégia de degradação (quando o store do rate limit falha)

Você precisa decidir o comportamento quando Redis/KV degrada:

### Rotas críticas (pagamentos, alteração de estado)

* **Fail-closed**: se não dá pra verificar limite com segurança, bloqueia (ou reduz drasticamente).

### Rotas não críticas (status/consultas)

* **Fail-open com limite local conservador**: mantém UX sem derrubar tudo.

Recomendações:

* timeouts curtos no KV
* circuit breaker para não “arrastar” latência

---

## 5) Checklist rápido

### Rate limit adaptativo por cliente

* [ ] Chave inclui `client_id` e `endpoint`
* [ ] Limites por classe de endpoint
* [ ] Penalidade progressiva + cooldown
* [ ] 429 com `Retry-After`
* [ ] Alertas de anomalia por cliente

### Armazenamento resiliente

* [ ] KV distribuído com atomicidade (Redis `INCR`/Lua)
* [ ] TTL configurado corretamente
* [ ] Replicação + failover
* [ ] Timeouts curtos + circuit breaker
* [ ] Política de fail-open/fail-closed por rota

---

## 6) Resultado esperado

Com **rate limit adaptativo por cliente** + **contadores em cache distribuído atômico e replicado**:

* Incidentes por cliente bugado ficam contidos.
* Clientes bons não sofrem.
* A API mantém latência previsível e disponibilidade.
* O mecanismo de rate limiting não vira gargalo.
