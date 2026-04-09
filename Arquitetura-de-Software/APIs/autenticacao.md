# Autenticação resiliente e comunicação segura entre microserviços

Este doc cobre **duas situações comuns** em APIs de microserviços:

1. **IdP (Identity Provider) virando gargalo** por validação síncrona em alto tráfego.
2. **Proteger chamadas internas** (ex.: serviço Pedidos chamando Estoque) contra fontes não autorizadas.

---

## 1) Quando o Identity Provider vira gargalo

### Problema

* A plataforma depende do IdP para autenticar/autorizar **a cada requisição**.
* Em pico, o IdP vira **ponto único de falha**: latência sobe e começam falhas intermitentes.
* A dependência síncrona derruba a resiliência do ecossistema.

### Abordagem priorizada

**JWT assinado pelo IdP + validação local (offline) pelos microserviços.**

**Ideia:**

* O IdP participa do fluxo no **login/refresh** (emissão de token).
* Os microserviços validam **assinatura e claims** localmente, sem chamar o IdP em cada request.

### Fluxo recomendado (alto nível)

1. Cliente autentica no IdP (OIDC/OAuth2).
2. Recebe **access token JWT** (curto) + **refresh token**.
3. Cada chamada à API carrega o access token.
4. Gateway e/ou microserviços validam:

   * assinatura (RS256/ES256)
   * `iss`, `aud`, `exp`, `nbf`
   * scopes/roles/tenant

### Componentes e detalhes que importam

* **JWKS (JSON Web Key Set)**: os serviços buscam a chave pública do IdP e **cacheiam**.
* **Rotação de chaves**: suportar troca periódica sem downtime.
* **TTL curto** (access token): típico **5–15 min**.
* **Refresh**: renova tokens sem exigir login frequente.

### Segurança x revogação (trade-off real)

JWT offline não “revoga instantaneamente” sem alguma estratégia extra.

Opções práticas:

* **Preferida**: access token com **TTL curto** + refresh token revogável no IdP.
* **Quando precisa revogar na hora** (ex.: conta comprometida):

  * aplicar **denylist** (cache distribuído) por `jti`/hash do token, ou
  * **introspecção** só para rotas muito sensíveis (não para tudo).

### Benefícios

* Remove o IdP do caminho crítico por request.
* Reduz latência e picos de CPU no IdP.
* Evita falhas em cascata quando o IdP degrada.

### Armadilhas comuns

* Validar apenas assinatura e esquecer `aud/iss`.
* Aceitar token sem checar `exp`/clock skew.
* Cache de JWKS sem respeitar atualização (fallback e refresh).
* Tokens longos demais.

---

## 2) Garantir que só o serviço Pedidos chama o serviço Estoque

### Problema

Mesmo com autenticação do usuário final no gateway, o serviço Estoque está recebendo:

* requisições inválidas
* chamadas de fontes não autorizadas

Isso acontece porque **autenticação do usuário ≠ autenticação do serviço chamador**.
Você precisa de **service-to-service auth**.

### Abordagem priorizada

**Tokens de serviço (JWT) via OAuth2 Client Credentials** (ou STS) para comunicação interna.

**Ideia:**

* O serviço *Pedidos* se autentica como **cliente** no IdP/STS e recebe um JWT “de serviço”.
* O serviço *Estoque* valida o JWT e autoriza a operação baseada em **claims/scopes**.

### Fluxo recomendado (alto nível)

1. Pedidos solicita token via **Client Credentials**:

   * `client_id=pedidos`, `client_secret`/mTLS/assinatura
2. IdP/STS emite **JWT de serviço** com:

   * `sub=svc:pedidos`
   * `aud=svc:estoque`
   * `scope=estoque:read estoque:reserve`
   * `exp` curto (ex.: 2–5 min)
3. Pedidos chama Estoque com `Authorization: Bearer <jwt>`.
4. Estoque valida offline:

   * assinatura + `iss/aud/exp/scope`

### Por que não basta whitelisting de IP

* autoscaling muda IP
* NAT/egress compartilhado
* ambientes multi-tenant
* manutenção frágil

### E mTLS?

mTLS é ótimo para o **transporte**, mas depende de como é aplicado:

* **mTLS Gateway↔Estoque** autentica o **gateway**, não garante que o chamador foi o serviço Pedidos.
* Para identidade do serviço, o ideal é **mTLS serviço↔serviço** (ex.: service mesh) ou token de serviço.

**Melhor prática comum:**

* **JWT de serviço (autorização fina)** + **mTLS interno (identidade no transporte)**.

### Como lidar com “duas identidades” (usuário + serviço)

Cenário comum: Pedidos recebe request do usuário, mas ao chamar Estoque precisa provar:

* **quem é o usuário** (contexto)
* **quem é o serviço chamador** (permissão interna)

Padrões:

* **Token de serviço separado** para chamada interna (recomendado).
* Opcional: propagar contexto do usuário em headers assinados ou token “act-as/obo” (on-behalf-of) — só se você tiver necessidade clara e controle forte.

### Benefícios

* Estoque consegue negar chamadas que não sejam do serviço Pedidos.
* Reduz superfície de ataque quando alguém tenta “bater direto” no serviço.
* Autorizações ficam explícitas (scopes/claims), fáceis de auditar.

### Armadilhas comuns

* Não restringir `aud` → token emitido para outro serviço pode ser aceito.
* Scopes genéricos demais.
* Tokens longos (revogação/risco maior).
* Falta de rate limit e validações de payload no serviço.

---

## 3) Checklist rápido de implementação

### JWT offline (usuário)

* [ ] Validar `iss`, `aud`, `exp`, `nbf`
* [ ] Validar scopes/roles/tenant
* [ ] JWKS cacheado com estratégia de refresh
* [ ] Access token curto + refresh token
* [ ] Estratégia de revogação (TTL curto + opcional denylist/introspecção seletiva)

### JWT service-to-service

* [ ] Client Credentials / STS configurado
* [ ] `sub` identifica serviço (ex.: `svc:pedidos`)
* [ ] `aud` específico do serviço destino (ex.: `svc:estoque`)
* [ ] Scopes mínimos necessários
* [ ] TTL curto (minutos)
* [ ] Auditoria/telemetria por operação

### Transporte e rede

* [ ] TLS sempre
* [ ] Considerar mTLS interno (service mesh) para reforçar identidade e criptografia ponta-a-ponta
* [ ] Gateways não devem ser o único ponto de defesa; serviços devem validar o que importa

---

## 4) Resultado esperado

Com as duas abordagens:

* O IdP sai do caminho crítico e deixa de ser gargalo por requisição.
* A plataforma fica mais resiliente a picos e falhas do IdP.
* Chamadas internas ficam controladas por identidade de serviço (Pedidos → Estoque), reduzindo tráfego não autorizado.