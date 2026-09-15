# 🚀 Lab 06 — Release (CD): ambientes, slots, gates e Logic Apps

> **Tema:** Continuous Delivery no Azure Pipelines — Releases clássicos, deployment slots, aprovações, gates e Logic Apps
> **Pré-requisitos:** [Lab 05 — build clássico verde](lab-05-pipelines-build-classica.md) (é o artefato dele que o CD consome) · [Lab 03 — Repos](lab-03-repos-azure-devops-github-codespaces.md)
> **Conceitos base:** CD · deploy ≠ release · approvals / checks / gates · runOnce, rolling, canary, blue-green · deployment slots e swap · Azure Front Door · Logic Apps · variable groups
> **Curso:** Azure Academy — Azure DevOps & GitHub · Módulo 6 (Pipelines — Release e Logic Apps)
> **Material:** `materiais/06-Release-Pipelines-Release-e-Logic-Apps.pdf` · lab online [`labpipelinesclassicvsyaml`](https://labs.azureacademy.com.br/labs/devops/labpipelinesclassicvsyaml)
> **Executado em:** 30/08/2026 — em variante adaptada, ver a seção de execução

---

## 🎯 Objetivo do Lab

Fechar o ciclo da formação: **Boards planeja → Repos versiona → CI builda o artefato → CD promove por ambientes** com portões e estratégia proporcional ao risco.

Concretamente: pegar o artefato `drop` (9,1 MB) que a [`AzureAcademy-CI`](lab-05-pipelines-build-classica.md) já produz e promovê-lo por **dev → test → produção**, sendo que a passagem para produção é um **swap de slots** com **aprovação humana** antes.

---

## 📐 Os conceitos que o módulo cobra

### CD não é uma coisa só

| | Continuous **Delivery** | Continuous **Deployment** |
|---|---|---|
| O que garante | O artefato está **pronto para produção** a qualquer momento | Toda mudança aprovada **vai** para produção |
| O clique final | **Humano** (aprovação) | **Nenhum** — é automático |

Ambos abreviam "CD", e trocar um pelo outro numa conversa de arquitetura muda completamente o desenho dos portões.

### Deploy ≠ Release

> **Deploy** é levar o código ao ambiente. **Release** é torná-lo visível ao usuário.

Separar os dois é o que permite publicar com segurança e liberar quando quiser. Os dois mecanismos que fazem isso:

- **Deployment slots** — o código sobe num slot que ninguém acessa; o swap decide quando ele vira produção
- **Feature flags** — o código já está em produção, desligado; a flag decide quando ele aparece

### Approvals, Checks e Gates — três coisas diferentes

Isto é o que mais confunde, porque o módulo mistura o mundo **clássico** com o mundo **YAML**:

| Mecanismo | Onde vive | Quem controla | Automático? |
|---|---|---|---|
| **Approval** (clássico) | No **stage** do release | Dono do pipeline | ❌ humano |
| **Gate** (clássico) | Pré/pós-deploy do stage | Dono do pipeline | ✅ reavalia em intervalos |
| **Check** (YAML) | No **environment** | **Dono do recurso** | depende do tipo |

> 🔑 **A diferença que importa:** no clássico, quem configura o portão é quem escreve o pipeline — então quem escreve o pipeline pode **remover** o portão. No YAML com *environments*, o check pertence ao **dono do ambiente**: vale para qualquer pipeline que use aquele environment, e o dono do pipeline não contorna. É segregação de papéis de verdade.

**Tipos de Check disponíveis num environment:**

| Check | O que faz |
|---|---|
| Manual approval | Uma ou mais pessoas aprovam |
| Invoke REST API | Chama serviço externo e valida a resposta |
| Invoke Azure Function | Valida via function (resposta ou callback) |
| Query Azure Monitor | Só avança se não houver alertas ativos |
| **Exclusive lock** | Só um run por vez implanta no ambiente |
| Business hours | Deploy só dentro da janela permitida |
| Branch control | Só de branches autorizados (ex.: `main`) |
| Required template | Exige que o pipeline estenda um template seguro |

**Uma única reprovação barra o stage.**

**Tipos de Gate (clássico):** Azure Monitor alerts · Query Work Items (bloqueia se houver bug crítico aberto) · Invoke REST API · Invoke Azure Function.

### Estratégias de deployment

Definidas no bloco `strategy` do deployment job (YAML) ou implícitas no desenho dos stages (clássico):

| Estratégia | Como funciona | Onde usar |
|---|---|---|
| **runOnce** | Implanta tudo de uma vez | dev, ambientes pequenos |
| **Rolling** | Substitui as instâncias em lotes (`maxParallel`) | reduz downtime |
| **Canary** | Libera para 5% → 25% → 100%, medindo a cada incremento | produção sensível |
| **Blue-Green** | Sobe a nova versão em paralelo e troca o tráfego de uma vez (swap) | zero downtime |

> ★ **Boa prática do curso:** quanto mais crítico o ambiente, mais gradual a estratégia. `runOnce` em dev; canary ou blue-green em produção, para limitar o raio de impacto.

**Hooks do canary:** `preDeploy` → `deploy` → `routeTraffic` → `postRouteTraffic` → `on: success / failure`. É no `postRouteTraffic` que o health check decide **promover ou reverter**.

### Blue-Green com slots

```
Slot: production  (blue) v1  ──swap──►  Slot: staging (green) v2
      usuários sempre no slot 'production'
      o swap só troca QUAL versão está lá
```

Três propriedades que fazem isso valer a pena:

- **Rollback instantâneo** — deu problema? swap de volta, sem novo deploy
- **Warm-up** — o swap aquece as instâncias antes de trocar, então não há primeira request lenta
- **Validação com tráfego real de teste** — smoke tests no green antes de promover

> ★ **Nunca ligue deploy contínuo direto no slot de produção.** Implante no green, valide, promova por swap.

---

## 🧱 O lab principal — CD por ambientes + slots

### Parte 1 — no Azure

1. Criar um **App Service Windows, camada S1**
2. No recurso → **Slots de implantação** → criar slot **`dev`** e slot **`test`**

> ⚠️ **A camada S1 não é escolha estética — é requisito técnico.** *Deployment slots não existem nas camadas Free, Shared e Basic.* Standard (S1) dá 5 slots; Premium dá 20. Sem Standard, não há lab.

### Parte 2 — no Azure DevOps

3. **Pipelines → Releases → New pipeline**
4. **Add artifact** → apontar para o build `AzureAcademy-CI` (ou 2 branches distintos)
5. Ativar o **gatilho de implantação contínua** (ícone de raio no artefato) → dispara o release a cada build novo
6. **Stage DEV** → task **`Azure App Service Deploy`** → deploy no slot `dev`
7. **Stage TEST** → mesma task, apontando para o slot `test`
8. **Stage PRODUÇÃO** → task **`App Service Manage`**, ação **Swap Slots**, trocando `test` ↔ `production`
9. **Pré-aprovação** no stage de produção — ninguém faz swap sozinho

```
  drop (9,1 MB)          Stage DEV            Stage TEST          Stage PRODUÇÃO
  do AzureAcademy-CI  ──► App Service     ──►  App Service    ──►  App Service Manage
                          Deploy → dev         Deploy → test       Swap test ⇄ production
                            automático           automático          🔒 approval
```

### Parte 3 — labs extras

- **Gates:** Marketplace → instalar extensões de *Release Gates* → configurar no botão antes/depois dos stages
- **Zero downtime com Front Door:** 2 webapps + Azure Front Door + Automation Account com 4 runbooks que ativam/desativam o backend do pool antes de cada deploy
- **Logic Apps:** Logic App com trigger *"Quando uma solicitação HTTPS for recebida"* → ação de e-mail (Office 365/Gmail) → e depois apontar um **Gate do release** para o Logic App
- **AKS:** importar [`RubensGuimaraesMVP/aks`](https://github.com/RubensGuimaraesMVP/aks), build Docker → ACR, release com template *Deploy to a Kubernetes*

**Comandos do Front Door** (vão em runbooks de uma Automation Account, disparados pelo pipeline):

```bash
# desativar o endpoint antes do deploy
az extension add --name front-door
az account set --subscription "ALIAS_DA_ASSINATURA"
az network front-door backend-pool backend update \
   --front-door-name NOME_FRONT_DOOR --index 1 \
   --pool-name NOME_POOL --resource-group GRUPO_DE_RECURSOS --disabled true

# reativar depois
az network front-door backend-pool backend update \
   --front-door-name NOME_FRONT_DOOR --index 1 \
   --pool-name NOME_POOL --resource-group GRUPO_DE_RECURSOS --disabled false
```

> `--index` é a **posição do webapp dentro do pool**, não um id. Errar o índice desativa o backend errado — e derruba o que estava servindo.

---

## ✅ O que foi realmente executado (30/08/2026)

O lab **foi feito**, mas numa **variante forçada pelas restrições da conta**. Vale entender a diferença antes de comparar com o vídeo da aula.

### O ambiente que subiu

```
_AzureAcademy-CI  ──►  DEV  ──►  TEST  ──►  PRODUCAO
   ⚡ CD trigger      + task       ↓          🔒 approval
                    Azure CLI   academy-mvc-   academy-mvc-
                   (runbook)     wsousa-test      wsousa
                        ↓
              academy-mvc-wsousa-dev
```

| Recurso | Detalhe |
|---|---|
| Service connection | `Azure-AzureAcademy` — ARM + workload identity federation |
| Plano | `plan-academy-b1` — **B1 Windows, West Europe**, 3 apps |
| Web Apps | `academy-mvc-wsousa` · `-dev` · `-test` — ASP.NET 4.8 |
| SQL | `sql-academy-wsousa` · `AzureAcademyDB` na **oferta gratuita** |
| Automation | `auto-academy-wsousa` (Free) + runbook `sqlescala` publicado |
| Release | `MVC` · `definitionId=1` · 3 stages encadeados por `environmentState` |

**Custo real enquanto esteve no ar: ~R$ 2,30/dia** — só o plano B1. Muito abaixo dos ~R$ 13/dia do S1 que o lab pede.

> 🟢 **O ambiente foi destruído em 30/08/2026.** O release `MVC` continua no Azure DevOps como material de estudo, apontando para recursos que não existem mais. Para remontar: [ambiente-lab-azure.md](ambiente-lab-azure.md).

➡️ Para recriar tudo em ~10 minutos: **[ambiente-lab-azure.md](ambiente-lab-azure.md)** + os scripts em [`scripts/`](scripts/).

### 🔴 A diferença: 3 web apps em vez de 3 slots

O lab pede **App Service S1 com slots `dev` e `test`** e um **swap** no final. Isso **não roda nesta conta** — e a prova é empírica, testada tier por tier e região por região:

| Tier | Brazil South | East US | East US 2 | West Europe |
|---|---|---|---|---|
| F1 (gratuito) | ❌ `Total VMs: 0` | ❌ | ❌ | ✅ |
| B1 | ❌ | — | — | ✅ |
| **S1 (Standard)** | ❌ `not allowed to... serverfarm` | — | — | ❌ |

São **dois bloqueios independentes**:

1. **Quota de compute = 0 nas Américas** — nas *duas* assinaturas da conta
2. **Standard+ barrado em toda região** — mensagem diferente, restrição antifraude de conta PayAsYouGo nova

Ambas são `PayAsYouGo_2014-09-01` com `spendingLimit: Off` — **não é falta de crédito**.

E como slots exigem Standard, o teste final fecha o diagnóstico:

```
ERROR: Cannot complete the operation because the site will exceed
       the number of slots allowed for the 'Basic' SKU.
```

> 🔑 **O que se perde e o que se mantém.** Sem slots, some o **swap** — e com ele o rollback instantâneo e o warm-up. Mantém-se tudo o mais do módulo: artefato, gatilho de CD, encadeamento de stages, aprovações e gates. É uma perda de **mecanismo**, não de conceito.

Para destravar o swap de verdade: chamado de aumento de cota (gratuito) pedindo Standard.

### A extensão de runbook não existe mais

O professor usa a task **"Call an Automation Runbook"**. Ela foi **descontinuada e removida** do marketplace — buscando `runbook` em Azure Pipelines sobram 3 extensões de terceiros, com 469, 23 e 15 instalações.

A substituição é a task **Azure CLI**, que já vem nativa:

```bash
az automation runbook start \
  --resource-group AzureAcademy \
  --automation-account-name auto-academy-wsousa \
  --name sqlescala \
  --parameters EDITION=standard SERVICE_OBJECTIVE=S0
```

Melhor que a extensão em três aspectos: sem dependência de terceiro abandonável, reaproveita a service connection existente, e é a mesma abordagem que o PDF deste módulo já usa nos runbooks do Front Door.

> 🔴 **Não rode esse comando como está.** `EDITION=standard SERVICE_OBJECTIVE=S0` são do modelo **DTU**; o `AzureAcademyDB` está em **vCore Serverless com free limit**. Executar **tira o banco da oferta gratuita permanentemente** — e é uma por assinatura. Para testar o mecanismo sem custo, use `SERVICE_OBJECTIVE=GP_S_Gen5_4`.

### Credencial fora do runbook

O script do professor traz `$SqlPass = "SENHA_BANCO"` em texto puro. Runbook é **legível por qualquer pessoa com acesso à Automation Account** — credencial ali é vazamento por design. A versão deste repositório usa:

```powershell
$SqlPass = Get-AutomationVariable -Name 'SqlPass'
```

com a variável criada como **criptografada** na conta. Ver [`scripts/sqlescala.ps1`](scripts/sqlescala.ps1).

### O que é uma service connection, e por que ela vem antes de tudo

É a **identidade** que o Azure Pipelines usa para agir na sua assinatura. Ao criar uma do tipo *Azure Resource Manager*, o Azure DevOps registra um **service principal** no Entra ID e lhe dá papel **Contributor** no escopo escolhido.

Sem ela, a task `Azure App Service Deploy` não tem sequer como listar os App Services — o campo fica vazio e **o pipeline não salva**.

> 🔑 **Ela é gratuita.** Criar a service connection não gera nenhum recurso cobrável. Vale criar **antes** de resolver a quota, porque destrava toda a configuração do release.

---

## 💰 A conta deste lab

| Recurso | Como ficou | Custo |
|---|---|---|
| **App Service** | B1 Windows (S1 bloqueado) — 3 apps num plano só | **~R$ 2,30/dia** |
| **SQL Database** | `--use-free-limit` · 100k vCore-s/mês · 32 GB | **R$ 0** |
| **Automation Account** | Free tier · 500 min/mês | **R$ 0** |
| Service connection · release | — | **R$ 0** |
| *(não feito)* Azure Front Door | Lab de zero downtime | ~US$ 35/mês |

> 💡 **A cobrança é por plano, não por app.** Três web apps no mesmo B1 custam o mesmo que um. Foi isso que permitiu substituir os slots sem multiplicar a conta.

> ⚠️ **Destruir o grupo de recursos não zera tudo.** O Azure DevOps cobra à parte — o job paralelo Microsoft-hosted (~R$ 210/mês) vive em `_settings/billing` e sobrevive. A boa notícia: cobrança **diária pró-rata**, então zerar para de cobrar no mesmo dia.

---

## 🐞 Troubleshooting Comum

| Sintoma | Causa provável | Onde olhar |
|---|---|---|
| Task de deploy sem App Service na lista | Sem service connection, ou o SP não tem papel no escopo | `Project settings → Service connections` |
| `Slots` não aparece no menu do App Service | Plano abaixo de Standard | Free/Shared/Basic **não** têm slots |
| `not allowed to create or update the serverfarm` | Standard+ bloqueado na conta | Use B1; peça aumento de cota |
| `Current Limit (Total VMs): 0` | Quota regional zerada | Tente West Europe |
| Release não dispara sozinho após o build | Gatilho de CD desligado no artefato | Ícone de raio no card do artefato |
| `Save` cinza no editor de release | Input obrigatório vazio em **algum** stage | Percorra os 3 stages |
| Artefato errado e campo travado | *Source (build pipeline)* é imutável | Remova e readicione o artefato |
| Swap troca, mas o site fica lento na primeira request | Sem warm-up configurado | `WEBSITE_SWAP_WARMUP_PING_PATH` |
| Config do slot vaza para produção após o swap | App settings sem *deployment slot setting* marcado | Marque como **slot setting** o que é específico do ambiente |
| Gate reprova sempre | Intervalo de reavaliação menor que o tempo de estabilização | Ajuste *sampling interval* e *minimum success duration* |
| Runbook falha em `Get-AutomationVariable` | Variável `SqlPass` não criada | Automation Account → Variáveis |

---

## 🧠 Conceitos Aprendidos

- **"CD" é ambíguo por design.** *Delivery* garante que dá para publicar; *Deployment* publica. A diferença é um clique — e todo o desenho de governança gira em torno dele.
- **Deploy e release são eventos separados.** Slots e feature flags existem para desacoplar "o código está no ar" de "o usuário vê o código".
- **Quem configura o portão define quem pode contorná-lo.** Approval de stage clássico pertence ao dono do pipeline; check de environment pertence ao dono do ambiente. A segunda forma é a que sobrevive a uma auditoria.
- **Gate ≠ approval.** Gate é automático e **reavaliado em intervalos** — ele espera o ambiente ficar saudável. Approval é humano e acontece uma vez.
- **Slot é infraestrutura, não configuração.** Ele depende da camada do plano. Escolher Basic para economizar **elimina a possibilidade** de blue/green — e isso foi provado na prática aqui, não lido na documentação.
- **O swap é o rollback mais rápido que existe.** Não há redeploy: as duas versões já estão de pé, e o swap só troca qual atende o tráfego.
- **Service connection é identidade, não conectividade.** Um service principal no Entra com papel na assinatura — o primeiro item de qualquer checklist de CD no Azure.
- **Extensão de marketplace é dependência com prazo de validade.** A task oficial de runbook sumiu. Quando existe equivalente nativo (Azure CLI), ele envelhece melhor.

---

## ✅ Quiz Mental

<details>
<summary>Por que o lab exige S1 e não serve F1, se o F1 é gratuito?</summary>

Porque **deployment slots não existem abaixo de Standard**. Free, Shared e Basic não têm o recurso — não é limitação de quantidade, é ausência total.

E sem slots não há swap; sem swap não há blue-green; sem blue-green o lab perde o ponto inteiro. O custo aqui é requisito técnico, não conforto.

</details>

<details>
<summary>Qual a diferença prática entre pôr uma approval no stage e pôr um check no environment?</summary>

**Quem manda.**

A approval de stage clássico é configurada **dentro do pipeline** — quem edita o pipeline pode removê-la. Serve como disciplina de equipe, não como controle.

O check de environment pertence ao **dono do recurso** e vale para **qualquer** pipeline que consuma aquele environment. Quem escreve o pipeline não contorna. É a diferença entre uma convenção e um controle.

</details>

<details>
<summary>O swap terminou e a aplicação em produção quebrou lendo a connection string errada. O que aconteceu?</summary>

Uma app setting que deveria ser **específica do slot** não foi marcada como *deployment slot setting*.

Por padrão, as configurações **acompanham o conteúdo** no swap. A connection string de teste foi junto para produção. O que é específico do ambiente — connection string, endpoint, chave de API — precisa estar marcado como *slot setting* para **ficar no slot** em vez de viajar com o código.

</details>

<details>
<summary>Por que um gate é reavaliado em intervalos em vez de uma vez só?</summary>

Porque ele mede o **estado do ambiente**, e estado oscila. Logo após um deploy é normal haver picos de erro enquanto as instâncias aquecem.

Se o gate avaliasse uma vez só, ele reprovaria por ruído transitório. Por isso existem *sampling interval* (de quanto em quanto tempo consultar) e *minimum success duration* (por quanto tempo precisa ficar bom antes de liberar). Ele espera o ambiente **estabilizar**, não só ficar bom por um instante.

</details>

<details>
<summary>Sem slots, o que exatamente se perde do módulo?</summary>

Perde-se o **mecanismo de troca**: swap instantâneo, rollback sem redeploy e warm-up antes de receber tráfego.

Mantém-se **todo o resto**: o artefato promovido entre ambientes, o gatilho de CD, o encadeamento de stages por `environmentState`, a aprovação humana antes da produção, e os gates. A arquitetura de CD é a mesma — só a última milha muda de "trocar o slot" para "implantar noutro app".

</details>

<details>
<summary>No lab do Front Door, o que acontece se o <code>--index</code> estiver errado?</summary>

Você desativa o backend **errado** — provavelmente o que estava servindo os usuários — enquanto o outro está recebendo deploy. Resultado: os dois fora, downtime total, no exato script que existia para evitar downtime.

`--index` é posição no pool, não identificador. Vale ler o pool antes (`az network front-door backend-pool show`) em vez de confiar num número fixo no runbook.

</details>

---

## 🗺️ Status do Roadmap

| Fase | O que é | Status |
|---|---|---|
| 1 · **Artefato de build** | `drop` 9,1 MB da `AzureAcademy-CI` | ✅ [lab-05](lab-05-pipelines-build-classica.md) |
| 2 · **Conceitos de CD** | Approvals, checks, gates, estratégias | ✅ este documento |
| 3 · **Service connection ARM** | Identidade do pipeline no Azure | ✅ `Azure-AzureAcademy` |
| 4 · **Infraestrutura** | Plano B1 + 3 web apps + SQL + Automation | ✅ [ambiente-lab-azure.md](ambiente-lab-azure.md) |
| 5 · **Release DEV → TEST → PROD** | 3 stages, CD trigger, aprovação | ✅ `MVC` · `definitionId=1` |
| 6 · **Chamar runbook do pipeline** | Task Azure CLI | ✅ configurada (não executada) |
| 7 · **Rodar o release ponta a ponta** | `Create release` | 🔜 |
| 8 · **Swap real com slots** | Depende de liberar Standard | 🔜 chamado de cota |
| 9 · **Logic App como gate** | Trigger HTTP → e-mail → gate | 🔜 |
| 10 · *(extra)* **Front Door** | 2 webapps + runbooks | 🔜 custo adicional |
| 11 · *(extra)* **AKS** | Docker → ACR → Kubernetes | 🔜 |

---

---

## 📚 Leitura complementar

| Livro | Onde | Por quê |
|---|---|---|
| **#09** *Implementing Azure DevOps Solutions* | cap. 4 — Continuous Deployment | Approvals, gates e estratégias de deploy |
| **#08** *Microsoft Azure Essentials: Azure Automation* | livro todo | Runbooks — base do `sqlescala` e do lab de Front Door |
| **#09** | cap. 7 — Dealing with Databases in DevOps | Por que escalar banco por pipeline é delicado |

> Acervo completo e critério de uso em **[bibliografia.md](bibliografia.md)**. Os arquivos ficam em `materiais/livros/`, fora do controle de versão.

## 🔗 Conexões

| Tema | Onde |
|---|---|
| **Recriar o ambiente do zero** | **[ambiente-lab-azure.md](ambiente-lab-azure.md)** · [`scripts/`](scripts/) |
| O build que alimenta este CD | [lab-05 — build clássico](lab-05-pipelines-build-classica.md) |
| A app que está sendo publicada | [Anatomia do `build_mvc`](projeto-build-mvc.md) |
| Onde a quota apareceu primeiro | [lab-03](lab-03-repos-azure-devops-github-codespaces.md) |
| IaC com ARM | [lab-04](lab-04-iac-arm-e-automacoes.md) |
| Custos e o que está sendo cobrado | [README](README.md) |
| Blue/Green e rollback fora do Azure | [Devops/Kubernetes](../../Kubernetes/), [Devops/Jenkins](../../Jenkins/README.md) |

---

## 💡 Reflexão Final

O módulo é o mais "de arquitetura" da formação. Os anteriores ensinam ferramentas — este ensina **onde colocar o freio**.

A ideia central não é técnica: é que **velocidade e segurança não são opostos, desde que o portão seja automático**. Um gate de Azure Monitor que segura a promoção quando a taxa de erro sobe entrega mais rápido que uma reunião semanal de mudança — e é mais confiável, porque não esquece nem tem pressa de sexta à tarde.

O detalhe mais subestimado é a **segregação de papéis** entre approval de stage e check de environment. É a diferença entre um controle que existe e um controle que alguém com pressa apaga em dois cliques — distinção de governança, não de DevOps.

E ficou uma lição que o material do curso não podia dar: **o roteiro pressupõe uma conta sem restrições**. Numa PayAsYouGo nova, S1 é barrado, slots somem junto, e a extensão de runbook nem existe mais. Adaptar sem perder o conceito — três web apps no lugar de três slots, Azure CLI no lugar da extensão — é a parte do trabalho que nenhum lab escrito consegue antecipar.
