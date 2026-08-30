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

> ⚖️ **Por que `pdfs/` e `materiais/` não vão para o GitHub:** são o material pago do instrutor. Este repositório é público, e publicá-los seria redistribuir conteúdo de terceiros. Eles ficam no disco para estudo offline; o que se publica são as **notas próprias** — que é o que este repositório inteiro sempre foi.

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
| ~~Grant de paralelismo~~ | ✅ **RESOLVIDO em 30/08/2026** — mas **não** pelo grant gratuito: existe **1 job paralelo Microsoft-hosted comprado** (`Billing → MS Hosted CI/CD → Paid parallel jobs = 1`). O pipeline **roda**; em compensação **custa** — ver a seção de Custos |
| 🔴 **Quota de compute = 0** | **NOVO em 30/08/2026.** `Azure subscription 1` recusa criar App Service Plan — até no **F1 gratuito** — com `Current Limit (Total VMs): 0`. Testado em Brazil South e East US 2. Trava o Web App do Módulo 3 e o deploy do Módulo 4. Saídas: usar a assinatura `Assinatura 1` ou pedir aumento de cota — detalhes em [lab-03](lab-03-repos-azure-devops-github-codespaces.md) |
| **Convidar usuários** | Só você — o convite dispara e-mail real |

---

## 💰 Custos — o que está sendo cobrado

Levantado em **30/08/2026** em `Cost Management → Análise de custo → Custo por recurso`, assinatura `Azure subscription 1` (`057d3c78-…`).

**Agosto/2026 (mês parcial): R$ 13,14.** Mas o número que importa é a **projeção mensal**, porque quase tudo começou a cobrar agora:

| Recurso | Tipo | Medidor | Ago/26 | Projeção/mês |
|---|---|---|---|---|
| `wallisonsousa` | Azure DevOps (org) | **Microsoft-hosted CI/CD Concurrent Job** | R$ 6,63 | **≈ R$ 210** (US$ 40) |
| `wallisonsousa` | Azure DevOps (org) | **Self-hosted CI/CD Concurrent Job** | R$ 2,49 | **≈ R$ 79** (US$ 15) |
| `front-assistente-contasreceber` | Static Web App **Standard** | Azure App Service — Standard App | R$ 1,77 | **≈ R$ 47** (US$ 9) |
| `front-dashboard-analise-90-dias` | Static Web App **Standard** | Azure App Service — Standard App | R$ 1,77 | **≈ R$ 47** (US$ 9) |
| `pipe-contasreceber` | Logic App | por execução | R$ 0,47 | variável |
| `datalakerconstasreceber` | Storage account | — | R$ 0 | ~R$ 0 |
| Synapse workspace + Spark pool + Foundry | — | — | **R$ 0** | **R$ 0 parado** |

> ✅ **Boa notícia:** o **Spark pool `spcontareceber` tem pausa automática ligada (15 min ociosos)** — ele só cobra vCore-hora quando um notebook roda. O SQL serverless do Synapse e o Azure AI Foundry também cobram **por uso**, não por hora parada. Nada disso é "torneira aberta".

### O que dá para cortar

| Ação | Economia | Perde o quê? |
|---|---|---|
| **Self-hosted paid parallel job: 1 → 0** | **≈ R$ 79/mês** | **Nada.** Não há agente self-hosted registrado, e a organização já ganha **1 job self-hosted grátis** |
| **Static Web Apps: Standard → Free** (os dois) | **≈ R$ 94/mês** | SLA, *linked backends*, auth customizada e private endpoint. Domínio customizado e deploy por GitHub Actions continuam funcionando |
| **MS-hosted paid parallel job: 1 → 0** | ≈ R$ 210/mês | **Trava os módulos 5–9 do curso.** Só zerar depois das aulas de pipeline — ou pedir o [grant gratuito](https://aka.ms/azpipelines-parallelism-request) (2–3 dias úteis) e zerar quando ele sair |

> 🔑 **A cobrança é diária pró-rata.** A própria tela de Billing avisa: *"This organization is enabled for user assignment based billing and **daily pro-rated charges**, instead of monthly committed purchases."* Baixar para 0 **para de cobrar no mesmo dia** — não é preciso esperar o ciclo fechar.

### Onde mexer

| O quê | Onde |
|---|---|
| Jobs paralelos pagos | `dev.azure.com/wallisonsousa/_settings/billing` → campos **Paid parallel jobs** |
| Conferir o efeito | `dev.azure.com/wallisonsousa/_settings/buildqueue?_a=concurrentJobs` |
| Plano do Static Web App | Portal → o recurso → *Visão geral* → **Atualizar seu plano de hospedagem** |
| Alerta de gasto | `Cost Management → Orçamentos` → criar orçamento (ex.: R$ 30/mês, alertas em 50/80/100 %) |

> ⚠️ **Nada em `ContasReceber` é do curso.** Esse grupo de recursos é um projeto real (Synapse, Data Lake, Foundry, Logic App, 2 front-ends). Os recursos do curso vão para o grupo **`AzureAcademy`**, ainda a criar.

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
