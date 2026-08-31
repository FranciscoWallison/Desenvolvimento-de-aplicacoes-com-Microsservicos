# ☁️ Azure Academy — Formação Azure DevOps & GitHub

> **Programa:** [Azure Academy](https://www.azureacademy.com.br) — *Programa de Aceleração de Conhecimento em Nuvem*
> **Formação:** Azure DevOps & GitHub (trilhas **AZ-400** e **AZ-305**)
> **Portal do aluno:** [labs.azureacademy.com.br](https://labs.azureacademy.com.br/matricula/login)
> **Formato:** aulas ao vivo com Q&A + **laboratórios práticos e projetos reais**

---

## 🎯 Do que trata a formação

A ementa cobre o ciclo completo de entrega em Azure DevOps + GitHub:

| Área | Conteúdo |
|------|----------|
| **Boards** | Work items, sprints, backlog, fluxo ágil ([Governanca-e-Gestao/Gestao](../../../Governanca-e-Gestao/Gestao/levantamento-de-requisitos.md)) |
| **Repos** | Git hospedado, branch policies, pull requests ([Devops/Gitflow](../../Gitflow/)) |
| **Pipelines** | CI/CD em YAML, agentes, **agent pools**, jobs paralelos |
| **Estratégias de deploy** | Blue/Green, canary, rollback |
| **GitHub** | Actions, Workflows, Codespaces |
| **Testes** | Automação, qualidade de código ([Devops/TDD](../../TDD/), [Devops/SonarQube](../../SonarQube/)) |

> 🔑 **Por que isto importa aqui:** o repositório já documenta CI/CD com **Jenkins** ([Devops/Jenkins](../../Jenkins/)) e orquestração com **Kubernetes** ([Devops/Kubernetes](../../Kubernetes/)). O Azure DevOps é o **mesmo problema resolvido pela plataforma gerenciada** — comparar as duas abordagens é metade do aprendizado.

---

## 📚 Índice

### Como executar as atividades

| Guia | Para quê |
|---|---|
| **[00 — Guia de Navegação MCP](00-guia-navegacao-mcp.md)** | Catálogo de URLs diretas, receitas por tipo de tarefa, erros comuns e o que só você pode fazer |
| **[Ambiente de laboratório](ambiente-lab-azure.md)** | **Montar todo o ambiente Azure do zero e destruir depois** — scripts prontos, matriz de bloqueios de quota, custo por recurso |
| **[Bibliografia](bibliografia.md)** | As **10 leituras complementares** do portal, mapeadas capítulo a capítulo para cada lab — e o que o curso não cobriu |

### Projetos usados nos labs

| Projeto | O que é | Documento |
|---|---|---|
| **`build_mvc`** | ASP.NET MVC 5 sobre .NET Framework 4.6.1 — a cobaia dos labs de Pipelines | **[Anatomia do projeto](projeto-build-mvc.md)** |
| `meu-hello-app` | Node/Express importado do `Azure-Samples/nodejs-docs-hello-world` | [lab-03](lab-03-repos-azure-devops-github-codespaces.md) |
| `IAC` | Templates ARM (`templateStorage/`) | [lab-04](lab-04-iac-arm-e-automacoes.md) |

### Setup inicial — guia rápido em PDF

| # | Atividade | Status |
|---|-----------|--------|
| **01** | [Criar a organização no Azure DevOps](01-criar-organizacao-azure-devops.md) | 📋 Documentado |
| **02** | [Ativar o Agent Pool (billing + jobs paralelos)](02-ativar-agent-pool.md) | 📋 Documentado |

### Módulos do curso — Turma 14

| # | Módulo | Laboratório | Status |
|---|--------|-------------|--------|
| **1** | DevOps | [Organizações, Projetos e Equipes](lab-01-organizacoes-projetos-e-equipes.md) | ✅ Executado (falta convidar usuários) |
| **2** | Boards | [Boards, Backlog, Sprints, Dashboards e Queries](lab-02-boards-backlog-sprints-dashboards-queries.md) | 🟡 Parcial |
| **3** | Repos | [Repos: Azure DevOps e GitHub + Codespaces](lab-03-repos-azure-devops-github-codespaces.md) | 🟡 Parcial (fases 4–5 desbloqueadas, a executar) |
| **4** | IAC | [Infra as Code e Automações (ARM)](lab-04-iac-arm-e-automacoes.md) | 🟡 Template pronto (PR #3) · grupo `AzureAcademy` ✅ · deploy travado na quota |
| **5** | Pipelines | [Pipelines — consertando um build clássico quebrado](lab-05-pipelines-build-classica.md) | ✅ **`AzureAcademy-CI` verde** (run #5) · artefato `drop` 9,1 MB |
| **6** | Release | [Release (CD): ambientes, slots, gates e Logic Apps](lab-06-release-cd-slots-e-logic-apps.md) | ✅ Executado em variante — 3 web apps no lugar de slots (Standard bloqueado) |
| **7** | Deployment Groups | [Deployment Groups: deploy em VMs com IIS](lab-07-deployment-groups-vms.md) | 📋 Documentado · falta VM registrada (quota de VM **existe**) |
| **8** | Testes | [Testes manuais e automatizados](lab-08-testes-manuais-e-automatizados.md) | 🟡 Automatizados ✅ na CI · manuais exigem licença paga |
| 9 | Extensões | Lab — Extensões | 🔜 |

> Os PDFs originais de cada módulo ficam em `materiais/` — **fora do controle de versão** (ver abaixo). O que se publica aqui são as notas próprias.

---

## 🗂️ Material do curso

| Arquivo | O que é | Versionado? |
|---------|---------|-------------|
| `pdfs/Ativar_Organizacao_e_Agent_Pool.pdf` | Guia rápido das 2 atividades de setup — transcrito e expandido em `01` e `02` | ❌ `.gitignore` |
| `pdfs/Guia de Participação.pdf` | Institucional: comunidade, infraestrutura, consultoria eSeth | ❌ `.gitignore` |
| `materiais/*.pdf` | Os **9 PDFs dos módulos**, baixados do portal do aluno | ❌ `.gitignore` |
| `materiais/livros/*.pdf` | Os **10 e-books** da biblioteca virtual — catalogados em **[bibliografia.md](bibliografia.md)** | ❌ `.gitignore` |

> ⚖️ **Por que `pdfs/` e `materiais/` não vão para o GitHub:** são o material pago do instrutor. Este repositório é público, e publicá-los seria redistribuir conteúdo de terceiros. Eles ficam no disco para estudo offline; o que se publica são as **notas próprias** — que é o que este repositório inteiro sempre foi.

> 📖 **Os e-books são outra coisa.** A biblioteca em `labs.azureacademy.com.br/pdfs` reúne títulos de **distribuição livre** (Microsoft Press, Apress, o Guia do Scrum sob Creative Commons). Mesmo assim ficam fora do git: o que este repositório publica é a **referência bibliográfica** — autor, título, capítulo — em [bibliografia.md](bibliografia.md), e cada lab agora tem uma seção *📚 Leitura complementar* apontando para o capítulo certo.

### Como rebaixar os materiais

Estão atrás de login, servidos por `leitorPdf.asp?token=<token>`. Com o MCP [`navegador`](../../../tools/mcp-navegador/):

```
wait_for_login({site:"lms"})   →  você loga (NÃO feche o navegador depois)
browser_download({url:"https://labs.azureacademy.com.br/leitorPdf.asp?token=…",
                  saveTo:"Devops/Cloud/Azure-Academy/materiais/NN-nome.pdf", expect:"pdf"})
```

> ⚠️ O cookie do portal é **de sessão**: ele morre quando o Chrome fecha. Baixe **sem** chamar `browser_close` no meio.

### Canais da comunidade

| Canal | Endereço |
|-------|----------|
| YouTube | [azurebrasilcomunidadetecnica](https://www.youtube.com/azurebrasilcomunidadetecnica) |
| LinkedIn | [company/azure-academy](https://www.linkedin.com/company/azure-academy) |
| Telegram | [t.me/azureacademy](https://t.me/azureacademy) |
| Meetup | [AzureAcademy](https://www.meetup.com/pt-BR/AzureAcademy) |
| Instagram | [@Azure_Academy](https://www.instagram.com/Azure_Academy) |

---

## 📌 Estado atual do ambiente

Trabalhando na organização **`dev.azure.com/wallisonsousa`** (a org nova `AzureAcademycurso` está bloqueada — ver abaixo).

| Item | Estado |
|---|---|
| **Time zone** da organização | `(UTC-03:00) Brasilia` ✅ |
| **Projeto** `AzureAcademy` | Agile · Private · Git ✅ |
| **Equipes** | `Squad Backend` · `Squad Frontend` (+ a Default) ✅ |
| **Areas** | Vinculadas 1:1 às equipes ✅ |
| **Preview features** | *PR Summary — large files* e *Experimental Themes* ligadas ✅ |
| **Nível Epics** no backlog | Ativado ✅ |
| **Work items** | Epic → 2 Features → 4 User Stories (18 pts) → 2 Tasks (10 h) ✅ |
| **Sprints** | Iterations 1–3 com datas ✅ |
| **Capacity** | 6 h/dia × 10 dias úteis = 60 h ✅ |
| **Query** | `User Stories do produto` ✅ |
| **Extensão** | `ms-devlabs.team-retrospectives` ✅ |

### 🔴 Bloqueios

| Bloqueio | Impacto |
|---|---|
| ~~Assinatura Azure desabilitada~~ | ✅ **RESOLVIDO em 29/08/2026** — pagamento efetuado. Agora há **duas assinaturas ativas**: `Assinatura 1` e `Azure subscription 1` |
| ~~Grant de paralelismo~~ | ✅ **RESOLVIDO em 31/08/2026** — e agora **de graça**. Em 30/08 o pipeline só rodava porque havia **1 job Microsoft-hosted comprado**; em 31/08 os pagos foram zerados e o **tier gratuito assumiu**: *1 job MS-hosted até 1.800 min/mês* + *1 self-hosted*. Roda igual, custa R$ 0 |
| 🔴 **Quota de compute = 0** | **NOVO em 30/08/2026.** `Azure subscription 1` recusa criar App Service Plan — até no **F1 gratuito** — com `Current Limit (Total VMs): 0`. Testado em Brazil South e East US 2. Trava o Web App do Módulo 3 e o deploy do Módulo 4. Saídas: usar a assinatura `Assinatura 1` ou pedir aumento de cota — detalhes em [lab-03](lab-03-repos-azure-devops-github-codespaces.md) |
| **Convidar usuários** | Só você — o convite dispara e-mail real |

---

## 💰 Custos — o que estava sendo cobrado (e o que sobrou)

> 🟢 **Estado em 31/08/2026: custo recorrente do curso = R$ 0.** Os grupos `AzureAcademy` foram apagados nas duas assinaturas, os jobs paralelos pagos foram zerados e os PATs revogados. Esta seção fica como **registro do levantamento** — é o tipo de conta que vale saber fazer.

Levantado em **30/08/2026** em `Cost Management → Análise de custo → Custo por recurso`, assinatura `Azure subscription 1` (`057d3c78-…`). **Agosto/2026 (mês parcial): R$ 13,14** — mas o número que importava era a **projeção mensal**, porque quase tudo tinha começado a cobrar naquela semana:

| Recurso | Tipo | Medidor | Ago/26 | Projeção/mês | Situação em 31/08 |
|---|---|---|---|---|---|
| `wallisonsousa` | Azure DevOps (org) | Microsoft-hosted CI/CD Concurrent Job | R$ 6,63 | ≈ R$ 210 (US$ 40) | ✅ **zerado** |
| `wallisonsousa` | Azure DevOps (org) | Self-hosted CI/CD Concurrent Job | R$ 2,49 | ≈ R$ 79 (US$ 15) | ✅ **zerado** |
| `front-assistente-contasreceber` | Static Web App **Standard** | App Service — Standard App | R$ 1,77 | ≈ R$ 47 (US$ 9) | ✅ **→ Free** |
| `front-dashboard-analise-90-dias` | Static Web App **Standard** | App Service — Standard App | R$ 1,77 | ≈ R$ 47 (US$ 9) | ✅ **→ Free** |
| `pipe-contasreceber` | Logic App | por execução/polling | R$ 0,47 | variável | ➡️ mantido (ingestão em uso) |
| `datalakerconstasreceber` | Storage account | — | R$ 0 | ~R$ 0 | ➡️ mantido |
| Synapse workspace + Spark pool + AI Services | — | — | **R$ 0** | **R$ 0 parado** | ➡️ mantido |

**Total cortado: ≈ R$ 383/mês.**

> ✅ **Nada disso era torneira aberta — e isso importa no diagnóstico.** O Spark pool `spcontareceber` tem **pausa automática em 15 min** ociosos; o SQL serverless do Synapse e os AI Services (gpt-4o em SKU **Standard**, não provisionado) cobram **por uso**. O que sangrava eram os itens de **preço fixo mensal** — jobs paralelos e tier Standard — que cobram exatamente igual usando ou não.

### As três lições de FinOps deste levantamento

| Lição | O caso concreto |
|---|---|
| **Preço fixo é mais perigoso que preço por uso** | O Spark pool assusta mais na tela e custava R$ 0; duas Static Web Apps discretas custavam R$ 94/mês paradas |
| **Tier alto sem usar o que ele oferece é desperdício puro** | As duas SWAs estavam em **Standard** sem *linked backend*, sem ambiente de staging, sem domínio próprio, sem auth customizada e sem enterprise edge — pagando por seis recursos e usando zero |
| **Comprar para destravar vira cobrança esquecida** | O job MS-hosted foi comprado para o Módulo 5 sair da fila. Quando o **grant gratuito** finalmente entrou, a compra continuou lá, cobrando em paralelo ao benefício gratuito |

> 🔑 **A cobrança é diária pró-rata.** A própria tela de Billing avisa: *"This organization is enabled for user assignment based billing and **daily pro-rated charges**, instead of monthly committed purchases."* Baixar para 0 **para de cobrar no mesmo dia** — não é preciso esperar o ciclo fechar.

> ⚠️ **Zerar o job pago SÓ é seguro depois que o grant gratuito aparece.** Confira em `_settings/buildqueue?_a=concurrentJobs`: tem que ler **"Free tier — 1 parallel job up to 1800 mins/mo"**. Sem essa linha, zerar trava as pipelines em `No hosted parallelism has been purchased or granted`.

### Onde mexer

| O quê | Onde |
|---|---|
| Jobs paralelos pagos | `dev.azure.com/wallisonsousa/_settings/billing` → campos **Paid parallel jobs** → **Save** |
| Conferir o efeito | `dev.azure.com/wallisonsousa/_settings/buildqueue?_a=concurrentJobs` |
| Plano do Static Web App | `az staticwebapp update -n <app> -g <rg> --sku Free` (reversível com `--sku Standard`) |
| Revogar PATs | `dev.azure.com/wallisonsousa/_usersSettings/tokens` → selecionar → **Revoke** (um por vez; a caixa múltipla não agrupa) |
| Alerta de gasto | `Cost Management → Orçamentos` → criar orçamento (ex.: R$ 30/mês, alertas em 50/80/100 %) |

> ⚠️ **Nada em `ContasReceber` é do curso.** Esse grupo de recursos é um projeto real (Synapse, Data Lake, AI Services, Logic App, 2 front-ends). Os recursos do curso vão para o grupo **`AzureAcademy`**, recriado pelo [ambiente-lab-azure.md](ambiente-lab-azure.md).

---

## 📌 Pendências — a aula parou no **lab de IaC + ARM** (29/08/2026)

✅ A assinatura foi reativada e o paralelismo foi comprado. ⚠️ Mas apareceu um bloqueio novo: **quota de compute zerada** na `Azure subscription 1` — o item 2 abaixo depende de resolvê-lo.

### 1. Grupo de recursos `AzureAcademy`

`portal.azure.com` → **Grupos de recursos** → **Criar**

| Campo | Valor |
|---|---|
| Assinatura | a que estiver ativa |
| **Nome** | **`AzureAcademy`** |
| Região | **Brazil South** (mesma da organização) |

> 💡 O grupo de recursos é a **fronteira de ciclo de vida**: tudo que nasce junto e morre junto fica no mesmo grupo. Apagar o grupo apaga tudo dentro dele — o que torna o lab fácil de limpar depois.

### 2. Web App a partir do `meu-hello-app`, com o link no ar

Criar o **App Service** dentro do grupo `AzureAcademy`:

| Campo | Valor |
|---|---|
| Nome | `meu-hello-academy` (vira a URL `.azurewebsites.net`) |
| Publicar | **Código** |
| Runtime | **Node 22 LTS** — ⚠️ o lab pede *Node 20*, que não existe mais |
| SO | Linux |
| Região | Brazil South |
| Plano | **F1 (Gratuito)** |

Depois, **Deployment Center** → *Azure Repos* → org `wallisonsousa` · projeto `AzureAcademy` · repo **`meu-hello-app`** · branch **`main`**.

O Azure cria o pipeline de build sozinho e publica. **Entregável: o link do app no ar**, mostrando a mensagem que já está commitada no `main`:

> `Hello Azure Academy - deploy continuo funcionando! v2`

> ✅ O repositório **já está pronto**: `package.json` com `"start": "node index.js"` é tudo que o **Oryx** (build service do App Service) precisa.

### 3. IaC a partir das Implantações do grupo de recursos

Este é o gancho para o **Módulo 4**:

`Grupos de recursos` → **`AzureAcademy`** → menu **Implantações** (*Deployments*)

Ali fica o histórico de cada implantação feita pelo portal — e cada uma tem **Modelo** (*Template*), com o **ARM template** e o arquivo de **parâmetros** que o Azure gerou.

> 🔑 **A sacada:** você não escreve o ARM do zero. Cria pelo portal uma vez, vai em *Implantações → Modelo → Baixar*, e o que sai é **infraestrutura como código pronta** — versionável no Repos e reexecutável em qualquer ambiente. O portal vira a ferramenta de autoria do seu IaC.

**Entregável:** ARM template exportado, commitado no repositório, e reimplantado a partir do arquivo.

### 4. PR #3 no repositório `IAC`

`templateStorage/template.json` + `parameters.json` estão prontos e o PR está aberto — falta **Approve + Complete**. O *Approve* é a sua assinatura de revisor; não é algo que o assistente deva clicar por você.

---

### 🟢 Módulo 3 — o que já está entregue

| Item | Estado |
|---|---|
| `AzureAcademySITE` — clone, branch, **PR #1** | ✅ mergeado no `main` |
| `meu-hello-app` — **importado** de `Azure-Samples/nodejs-docs-hello-world` (33 commits de histórico) | ✅ |
| `meu-hello-app` — branch, ajuste da home, **PR #2** | ✅ mergeado no `main` |
| Work items no Board (Epic 10 → Feature 11 → US 12/13/14) | ✅ todas `Closed`, PR #2 vinculado |

### 🟡 Pendente do Módulo 2

Dashboards · Work details (barras de capacidade) · Forecast por velocity · Taskboard · Sprint Burndown

### 🟡 Pendente do Módulo 1

Convidar usuários (`Organization settings → Users`) — dispara e-mail real, então é passo seu.

---

## 🛠️ Pré-requisitos para os laboratórios

| Requisito | Detalhe |
|-----------|---------|
| **Conta Microsoft** | A mesma usada no `portal.azure.com` |
| **Assinatura do Azure ativa** | Com **método de pagamento válido** — é ela que vira a conta de cobrança do Azure DevOps. Sem isso, a atividade 02 trava |
| **Navegador** | Chrome/Edge. As telas do Azure Portal são SPA e mudam com frequência |

> ⚠️ **Assinatura ≠ cobrança garantida.** Vincular a assinatura ao billing **não gasta nada por si só**: o tier gratuito de pipelines continua gratuito. A assinatura existe para que, **se** você passar do gratuito, exista para onde cobrar. Ainda assim, revise os valores antes de confirmar qualquer tela — veja a atividade [02](02-ativar-agent-pool.md) e a seção de Custos acima.

---

## 📸 Como estas notas foram capturadas

As capturas de tela em [`imgs/`](imgs/) são feitas pelo servidor MCP **[`navegador`](../../../tools/mcp-navegador/)**, deste mesmo repositório: um Chrome real com perfil persistente, dirigido pelo assistente enquanto navega o portal.

A divisão de trabalho é explícita e reforçada pelo próprio servidor:

| Etapa | Quem faz |
|-------|----------|
| Login, MFA, qualquer campo de senha | **Só você** — o servidor bloqueia essas telas por design |
| Navegar, preencher formulários comuns, ler telas | O assistente |
| Cobrança, compra, exclusão | O assistente **propõe**; você **aprova** num banner que aparece no navegador |
| Screenshots e redação das notas | O assistente |

Convenção dos arquivos: `imgs/{atividade}_{NN}_{descricao}.png` — caminho **relativo**, para o link funcionar igual no VS Code e no GitHub.

> 🔒 O menu de conta e campos de senha são **borrados automaticamente** nas capturas, porque este repositório é público. **Revise mesmo assim antes de commitar** — ID de assinatura, nome de tenant e e-mail podem aparecer em outros cantos da tela.

---

## 🔗 Conexões com o resto do repositório

| Tema | Onde já está documentado |
|------|--------------------------|
| Fundamentos de nuvem, Well-Architected | [Devops/Cloud/README.md](../README.md) |
| CI/CD com Jenkins (o contraponto self-hosted) | [Devops/Jenkins/README.md](../../Jenkins/README.md) |
| Contêineres e orquestração | [Devops/Docker](../../Docker/), [Devops/Kubernetes](../../Kubernetes/) |
| Fluxo de branches e commits semânticos | [Devops/Gitflow](../../Gitflow/) |
| Qualidade e testes | [Devops/TDD](../../TDD/), [Devops/SonarQube](../../SonarQube/) |
| Arquitetura de microsserviços | [Arquitetura-de-Software/Microsservicos](../../../Arquitetura-de-Software/Microsservicos/) |
