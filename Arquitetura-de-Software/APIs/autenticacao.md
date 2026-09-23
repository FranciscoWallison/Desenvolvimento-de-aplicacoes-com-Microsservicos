# Autenticação resiliente e comunicação segura entre microserviços

Este doc cobre **três temas** de autenticação em APIs de microserviços:

1. **Fundamento:** onde mora o estado da autenticação — sessão (monolito) × token (distribuído).
2. **IdP (Identity Provider) virando gargalo** por validação síncrona em alto tráfego.
3. **Proteger chamadas internas** (ex.: serviço Pedidos chamando Estoque) contra fontes não autorizadas.

---

## 1) Fundamento: sessão (stateful) × token (stateless)

Antes de falar de IdP e de chamada entre serviços, vale fixar **onde mora a memória do “quem é você”**. É essa decisão que separa o monolito clássico da arquitetura distribuída — e é ela que torna viável o JWT das seções seguintes.

### 1.1 Monolito: autenticação por sessão (stateful)

No monolito tradicional (front e back na mesma aplicação e no mesmo servidor), **quem lembra quem você é é o servidor**.

Fluxo:

1. O cliente envia usuário e senha.
2. O servidor valida e cria uma **sessão** — na memória do processo ou num store externo (Redis, banco).
3. O servidor devolve apenas o **identificador** dessa sessão num cookie (`JSESSIONID`, `PHPSESSID`, `connect.sid`).
4. Nas requisições seguintes o navegador manda o cookie sozinho; o servidor consulta o store e resolve: “essa sessão é do usuário X, pode passar”.

O cookie **não carrega dados do usuário** — é uma chave opaca. Todo o conteúdo fica do lado do servidor.

Consequências:

* **Com estado (stateful):** o servidor gasta memória/IO por usuário logado.
* **Escala horizontal exige cuidado:** com N instâncias atrás de um load balancer, a requisição pode cair numa instância que não tem aquela sessão. Saídas: **sticky sessions** (o LB prende o cliente a uma instância — frágil: caiu a instância, caiu o login) ou **store compartilhado** (Redis — resolve, mas reintroduz um ponto central).
* **Revogação é trivial:** apagou a sessão do store, o acesso morre no mesmo instante. Esse é o ponto forte real da sessão — e é exatamente a conta que o JWT cobra depois.

### 1.2 Front e back separados: autenticação por token (stateless)

Quando o front é uma SPA (React/Angular/Vue) ou um app mobile consumindo uma API, o padrão vira **token** — na prática, quase sempre **JWT**.

Fluxo:

1. O cliente envia credenciais para a API.
2. A API valida e **emite um token assinado**, que já carrega as informações do usuário (`sub`, e-mail, roles/permissões, `exp`).
3. A API devolve o token e **não guarda nada**.
4. A cada requisição o cliente manda o token no cabeçalho HTTP: `Authorization: Bearer <TOKEN>`.
5. O servidor **valida a assinatura e as claims**; se estiver válida e não expirada, libera — sem consultar banco nem store de sessão.

Consequências:

* **Sem estado (stateless):** o servidor não gasta memória guardando quem está logado.
* **Escala plana:** qualquer instância, de qualquer serviço da infraestrutura, valida o mesmo token de forma independente. É precisamente isso que a seção 2 explora para tirar o IdP do caminho crítico.

> ⚠️ **Um detalhe que costuma vir errado: JWT é assinado, não criptografado.**
> Um JWT padrão (JWS) é `base64url` — quem interceptar o token **lê o payload inteiro**, inclusive colando no jwt.io. A assinatura garante **integridade e origem** (ninguém altera as claims sem invalidar o token), não **sigilo**. Portanto: nada de CPF, dado sensível ou segredo no payload. Sigilo de verdade seria **JWE** (JWT criptografado) — raro; na prática TLS + payload magro resolve melhor.

### 1.3 Comparação direta

| Critério | Sessão (stateful) | Token / JWT (stateless) |
| --- | --- | --- |
| Onde mora o estado | Servidor (memória / Redis / banco) | No próprio token, com o cliente |
| O que trafega | ID opaco no cookie | Claims assinadas no header `Authorization` |
| Custo por requisição | Lookup no store (IO) | Verificação de assinatura (CPU, sem IO) |
| Escala horizontal | Sticky session ou store compartilhado | Qualquer instância valida sozinha |
| Revogar agora | Trivial (apaga a sessão) | **Difícil** — ver seção 2 |
| Tamanho trafegado | Poucos bytes | Centenas de bytes a alguns KB, **em toda** requisição |
| Sigilo do conteúdo | Total (fica no servidor) | Nenhum — payload é legível |
| CSRF | Exposto (cookie vai automático) | Não, se o token for enviado por header |
| XSS | `HttpOnly` protege o cookie | Token em `localStorage` é lido por JS |

### 1.4 Três coisas que “stateless” não significa

* **Stateless é o access token, não o sistema.** O **refresh token** normalmente é guardado e revogável no servidor. O caminho quente fica sem estado; o caminho de renovação continua com estado — e é aí que você recupera a revogação que a sessão dava de graça.
* **Não existe logout de verdade num JWT puro.** Apagar o token do cliente é “esquecer”, não “invalidar”: quem tiver uma cópia continua entrando até o `exp`. A defesa prática é **TTL curto (5–15 min)** + denylist por `jti` para os casos graves (seção 2).
* **Onde guardar o token no browser é decisão de modelo de ameaça, não de gosto.** `localStorage` é confortável e vulnerável a XSS; cookie `HttpOnly; Secure; SameSite=Strict` protege contra XSS mas traz CSRF de volta para a mesa. Não existe opção sem trade-off — existe a que combina com a sua ameaça.

### 1.5 Quando ainda vale usar sessão

Token não é “a evolução” da sessão; é a resposta a um problema diferente. Sessão continua sendo a escolha certa quando:

* a aplicação é um monolito renderizado no servidor (Rails, Laravel, Django, Spring MVC), sem API pública;
* revogação imediata é requisito duro (banco, saúde, área administrativa);
* o time é pequeno e uma instância + Redis resolve — ainda não há nada para escalar horizontalmente.

A pergunta útil não é “sessão ou token?”, e sim: **quantos processos independentes precisam responder “quem é esse usuário?” sem conversar entre si?** Um: sessão. Vários: token — e o resto deste doc é sobre fazer isso direito.

### 1.6 O mesmo tema nos meus repositórios

A teoria acima não é abstrata: os dois modelos já convivem no meu próprio GitHub. Mapeando:

| Repositório | Modelo | Como está feito |
| --- | --- | --- |
| [`Laravel-Vue.js`](https://github.com/FranciscoWallison/Laravel-Vue.js) | **Os dois, no mesmo codebase** | `SESSION_DRIVER=file` + `@csrf` nas views Blade (admin/site server-side) **e** SPA Vue com JWT: `services/jwt-token.js` guarda o token, `interceptors.js` injeta o `Bearer` e faz refresh no 401 |
| [`back-app-parceiro`](https://github.com/FranciscoWallison/back-app-parceiro) | Stateless maduro | NestJS + `passport-jwt`; access 15 min / refresh 7 dias, **segredos separados**, claim `type` para impedir usar refresh como access, `jti` por token, e tabela `revokedRefreshToken` no Prisma |
| [`agendaai-backend`](https://github.com/FranciscoWallison/agendaai-backend) | Stateless simples | Mesma base NestJS, sem par access/refresh e sem revogação — bom contraste com o de cima |
| [`front-app-parceiro`](https://github.com/FranciscoWallison/front-app-parceiro) | Cliente stateless | Interceptor Angular com allowlist de rotas públicas, refresh no 401 e retry; token no **Capacitor `Preferences`**, não em `localStorage` |
| [`nextjs-mg3`](https://github.com/FranciscoWallison/nextjs-mg3) | Cliente stateless | `tokenStore.ts` em memória + `localStorage`; middleware do Next valida o `Bearer` na borda |
| [`nlw-06-nodejs`](https://github.com/FranciscoWallison/nlw-06-nodejs) | Stateless didático | `middlewares/ensureAuthenticated.ts` — o `verify()` mínimo: extrai o header, valida, põe `sub` no request |
| [`ESTUDOS--back-end/jwt-demo`](https://github.com/FranciscoWallison/ESTUDOS--back-end) | Laboratório | `server.js` + `client.js` isolando só a emissão e a validação |
| [`Desenvolvimento-de-Web-APIs-.NET-Core`](https://github.com/FranciscoWallison/Desenvolvimento-de-Web-APIs-.NET-Core) | Stateless em .NET | `Startup.cs` com `AddJwtBearer` — o mesmo padrão fora do ecossistema Node |
| [`CraftRO`](https://github.com/FranciscoWallison/CraftRO), [`laravel-microservice-docker`](https://github.com/FranciscoWallison/laravel-microservice-docker) | Stateful clássico | Laravel com `config/session.php` — o monolito da seção 1.1, sem SPA no meio |
| [`vue-firebase-fb`](https://github.com/FranciscoWallison/vue-firebase-fb), [`nextjs_sis`](https://github.com/FranciscoWallison/nextjs_sis) | **Terceira via: IdP delegado** | `signInWithEmailAndPassword` do Firebase — quem emite e assina o token é o provedor; a aplicação só valida. É a seção 2 já resolvida por terceiro |

#### O que esse mapa ensina

* **`back-app-parceiro` é a prova prática da seção 1.4.** O access token é stateless (validado só por assinatura), mas o refresh passa por `prisma.revokedRefreshToken.findUnique()` antes de ser aceito. Ou seja: caminho quente sem estado, caminho de renovação com estado. Foi exatamente a solução descrita como recomendada — e ela já existe no meu código.
* **`Laravel-Vue.js` é a transição inteira num repositório só.** As telas Blade continuam com sessão e CSRF; a SPA já fala por `Authorization: Bearer`. É o retrato de quando o front se separa do back e o modelo de autenticação precisa mudar junto.
* **`front-app-parceiro` × `nextjs-mg3` mostram os dois lados do trade-off de armazenamento** da seção 1.4: `Preferences` (armazenamento nativo do app) versus `localStorage` (alcançável por XSS).

#### Três correções que esse mapa expõe

1. **Segredo JWT literal no código, em repositório público** — `nlw-06-nodejs`, em `src/middlewares/ensureAuthenticated.ts`, passa a chave de assinatura como string no próprio `verify()`. Com a chave pública, qualquer pessoa forja um token válido: a assinatura deixa de provar qualquer coisa. Projeto de estudo de 2021, impacto real baixo, mas o padrão é o que importa — chave vem de variável de ambiente, sempre.
2. **Fallback de segredo que falha em silêncio** — `back-app-parceiro` e `agendaai-backend` fazem `process.env.JWT_ACCESS_SECRET ?? 'dev-...-change-me'`. Se a variável faltar no deploy, a aplicação **sobe normalmente** assinando com uma string que está publicada no repositório. O correto é o oposto: sem a variável, **não subir**. Falhar no boot é barato; descobrir em produção, não.
3. **Refresh token em `localStorage`** — em `nextjs-mg3` o access *e* o refresh ficam no mesmo lugar. Um XSS leva os dois, e aí o TTL curto do access não protege nada, porque o atacante renova sozinho. Se o access vai para `localStorage` por conveniência, o refresh deveria ir para cookie `HttpOnly`.

---

## 2) Quando o Identity Provider vira gargalo

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

## 3) Garantir que só o serviço Pedidos chama o serviço Estoque

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

## 4) Checklist rápido de implementação

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

### Token no cliente (SPA / mobile)

* [ ] Access token curto; refresh token com rotação
* [ ] Escolha consciente entre `localStorage` (risco XSS) e cookie `HttpOnly; Secure; SameSite` (risco CSRF)
* [ ] Nenhum dado sensível no payload — JWT é assinado, não criptografado
* [ ] Logout também invalida o refresh token no servidor

### Transporte e rede

* [ ] TLS sempre
* [ ] Considerar mTLS interno (service mesh) para reforçar identidade e criptografia ponta-a-ponta
* [ ] Gateways não devem ser o único ponto de defesa; serviços devem validar o que importa

---

## 5) Resultado esperado

Com as abordagens acima:

* O IdP sai do caminho crítico e deixa de ser gargalo por requisição.
* A plataforma fica mais resiliente a picos e falhas do IdP.
* Chamadas internas ficam controladas por identidade de serviço (Pedidos → Estoque), reduzindo tráfego não autorizado.