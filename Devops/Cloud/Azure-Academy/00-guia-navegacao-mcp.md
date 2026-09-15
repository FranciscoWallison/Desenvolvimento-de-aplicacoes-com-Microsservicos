# 🧭 Guia de Navegação — dirigindo o Azure DevOps pelo MCP

> **Tema:** Como usar o servidor MCP [`navegador`](../../../tools/mcp-navegador/) para **executar as atividades do curso** e capturar evidência direto na documentação
> **Para quem:** você (ou o assistente) retomando o trabalho numa sessão nova
> **Base:** aprendizado real executando os Módulos 1 e 2 — inclui as armadilhas que só aparecem fazendo

---

## 🎯 O que este guia resolve

Clicar no Azure DevOps é lento e o portal é uma SPA que re-renderiza o tempo todo. Este guia reúne o que funciona: **URLs diretas** para cada tela, as **receitas** de cada tipo de tarefa, e os **erros que aparecem** no meio do caminho.

---

## 🚦 Antes de começar

### 1. Conferir se o servidor está de pé

```bash
export PATH="$PATH:/c/Users/walli/scoop/apps/nodejs-lts/current"
cd tools/mcp-navegador
npm run handshake      # 20 tools, initialize em ~400 ms
node scripts/smoke.js  # ponta a ponta com Chrome real
```

No Claude Code: `/mcp` → `navegador: connected`.

### 2. A divisão de trabalho (imposta pelo servidor, não é convenção)

| Etapa | Quem |
|---|---|
| Login, MFA, qualquer campo de senha ou OTP | **Só você** — bloqueio duro no servidor |
| Navegar, preencher formulários, ler telas, criar work items | O assistente |
| Cobrança, compra, exclusão | O assistente **propõe**, você **aprova** num banner na página |
| Convidar usuários (dispara e-mail real) | **Só você** — decisão sobre endereços de terceiros |
| Screenshots e redação das notas | O assistente |

---

## 🔑 Sessões: o que sobrevive e o que morre

Esta é a fonte nº 1 de tempo perdido.

| Sessão | Sobrevive a `browser_close`? | Por quê |
|---|---|---|
| **Azure DevOps / portal.azure.com** | ✅ Sim | Cookie persistente ("Continuar conectado") |
| **Portal do aluno (LMS)** | ❌ **Não** | Cookie de **sessão** ASP — morre com o navegador |

> 🚨 **Regra prática:** baixe todo o material do LMS **antes** de fechar o navegador. Se `browser_download` retornar `SESSAO_EXPIRADA`, é isso — o servidor devolveu HTML de login em vez do arquivo.

### A armadilha de identidade

Criar uma conta/tenant novo **troca a identidade** da sessão. O sintoma:

```
TF400813: The user 'f0f417ef-…' is not authorized to access this resource.
```

Não é permissão perdida — é a organização pertencer a **outra identidade do mesmo e-mail**. Correção:

1. `aex.dev.azure.com/me` → seletor de diretório → voltar para **Microsoft account**
2. Se o token continuar preso: `aex.dev.azure.com/_signout` e refazer o login
3. No seletor de conta, escolher **Conta pessoal**, não *Corporativa ou de estudante*

> 💡 Dá para saber em qual identidade você está pelo nome do perfil: `Wallison Sousa` = Microsoft account · `Wallison Francisco` = Default Directory.

---

## 🗺️ Catálogo de URLs diretas

Navegar direto economiza 3–5 cliques por tela. Substitua `{ORG}` e `{PROJ}`.

### Organização

| Tela | URL |
|---|---|
| Lista de organizações | `aex.dev.azure.com/me` |
| Overview (nome, **time zone**, região) | `dev.azure.com/{ORG}/_settings/organizationOverview` |
| Projetos | `dev.azure.com/{ORG}/_settings/projects` |
| **Users** (convidar) | `dev.azure.com/{ORG}/_settings/users` |
| **Billing** | `dev.azure.com/{ORG}/_settings/billing` |
| **Agent pools** | `dev.azure.com/{ORG}/_settings/agentpools` |
| **Parallel jobs** | `dev.azure.com/{ORG}/_settings/buildqueue?_a=concurrentJobs` |
| **Permissions** (9 grupos) | `dev.azure.com/{ORG}/_settings/groups` |
| Extensões instaladas | `dev.azure.com/{ORG}/_settings/extensions?tab=installed` |

### Projeto

| Tela | URL |
|---|---|
| **Teams** | `dev.azure.com/{ORG}/{PROJ}/_settings/teams` |
| **Permissions** (grupos + teams) | `dev.azure.com/{ORG}/{PROJ}/_settings/permissions` |
| **Notifications** | `dev.azure.com/{ORG}/{PROJ}/_settings/notifications` |
| **Project configuration › Iterations** | `dev.azure.com/{ORG}/{PROJ}/_settings/work?_a=iterations` |
| **Project configuration › Areas** | `dev.azure.com/{ORG}/{PROJ}/_settings/work?_a=areas` |
| **Team configuration › Backlogs** | `dev.azure.com/{ORG}/{PROJ}/_settings/work-team?_a=backlogs` |
| **Dashboards** | `dev.azure.com/{ORG}/{PROJ}/_dashboards` |

### Boards

| Tela | URL |
|---|---|
| Backlog (nível) | `dev.azure.com/{ORG}/{PROJ}/_backlogs/backlog/{TEAM}/Epics` — troque por `Features` / `Stories` |
| Work item por ID | `dev.azure.com/{ORG}/{PROJ}/_workitems/edit/{ID}/` |
| **Capacity** do sprint | `dev.azure.com/{ORG}/{PROJ}/_sprints/capacity/{TEAM}/{PROJ}/{SPRINT}` |
| Taskboard | `dev.azure.com/{ORG}/{PROJ}/_sprints/taskboard/{TEAM}/{PROJ}/{SPRINT}` |
| Nova query | `dev.azure.com/{ORG}/{PROJ}/_queries/new/` |
| **Retrospectives** | `dev.azure.com/{ORG}/{PROJ}/_apps/hub/ms-devlabs.team-retrospectives.home` |

> ⚠️ Nomes de team e sprint vão **URL-encoded**: `AzureAcademy%20Team`, `Iteration%201`.

---

## 🍳 Receitas

### O ciclo básico

```
browser_navigate  → a URL direta da tela
browser_wait_for  → { timeMs: 4000 }  (o portal é SPA; sem isso os refs vêm vazios)
browser_snapshot  → { selector: "..." }  ← SEMPRE com selector
browser_click / browser_type → usando o ref do snapshot
browser_screenshot → { lesson, slug } grava a evidência
```

> 🔑 **Nunca tire snapshot sem `selector`.** A árvore completa do Azure DevOps passa de 200 refs e a navegação lateral consome todo o orçamento antes de chegar no formulário. Com selector, a resposta cabe em 20 linhas.

### Criar hierarquia de work items (Epic → Feature → US → Task)

O caminho mais confiável — funciona para qualquer nível:

```
1. browser_navigate  → _workitems/edit/{ID_DO_PAI}/
2. snapshot #__bolt-menu-button-1  →  botão "Add link" (em Related Work)
3. click                            →  menu abre
4. snapshot [role=menuitem]:has-text('New item')  →  click
5. no diálogo:
     Link type      = Child          (padrão, e PERSISTE entre chamadas)
     Work Item Type = Feature / User Story / Task
     Title          = ...
6. click "Add link"    →  abre a ficha do novo item, já com Parent preenchido
7. (opcional) preencher Remaining Work / Story Points
8. click "Save and Close"
```

**Os campos `Link type` e `Work Item Type` mantêm o último valor** — criando 3 stories seguidas, só o título muda. Economiza metade dos passos.

> 🐞 **Pré-requisito esquecido:** o nível **Epics vem desligado**. A URL do backlog de Epics *redireciona em silêncio* para Stories. Ative primeiro em `_settings/work-team?_a=backlogs` → marcar **Epics** (salva sozinho, sem botão Save).

### Campos por seletor estável

O Azure DevOps usa IDs previsíveis — muito mais confiável que caçar por posição:

| Campo | Seletor |
|---|---|
| Story Points | `input[aria-labelledby*='Story']` |
| Remaining Work | `#__bolt-Remaining-input` |
| Original Estimate | `#__bolt-Original-Estimate-input` |
| Datas da iteração | `#fieldStartDate` · `#fieldEndDate` |
| Nome da iteração | `#fieldName` |
| Capacity per day | `[aria-label='Capacity per day']` |
| Salvar work item | `[role=menuitem]:has-text('Save')` |
| Salvar e fechar | `button:has-text('Save and Close')` |

### Dropdowns longos: use a busca

O seletor de time zone tem ~100 opções virtualizadas. Não role — filtre:

```
click no botão do dropdown
snapshot #__bolt-dropdown-1     →  revela um textbox "Search"
browser_type "Brasilia"         →  a lista reduz a 1 opção
click na opção
```

Mesmo padrão vale para qualquer combobox do portal.

### Datas

Formato **pt-BR**: `dd/MM/yyyy` (ex.: `31/08/2026`). Digite no campo; não é preciso abrir o calendário.

---

## 🐞 Erros e o que significam

| Erro / sintoma | Causa | Correção |
|---|---|---|
| **`STALE_REF`** | O nó foi substituído — clássico quando um botão vai de *disabled* para *enabled* (ex.: **Save** após editar um campo) | Novo `browser_snapshot` com selector; o ref volta a valer |
| `strict mode violation: resolved to N elements` | O selector pegou vários nós | Use o `id` que o próprio erro mostra — ele lista os candidatos com os IDs |
| Snapshot vem vazio / sem o formulário | A SPA ainda não renderizou | `browser_wait_for { timeMs: 4000 }` antes |
| `TF400813 … not authorized` | Identidade/tenant errado | Ver *A armadilha de identidade* acima |
| `browser_download` → `SESSAO_EXPIRADA` | Servidor devolveu HTML de login | Refazer login **sem** fechar o navegador |
| Clique "funciona" mas nada acontece | Abriu em **aba nova** | `browser_tabs { action: "list" }` e selecionar |
| `blocked: true` + token | Rail de segurança pegou a ação | `confirm_action { token }` → você aprova no banner → repetir com `confirmToken` |
| Botão certo mas página não muda | Tooltip de onboarding por cima (*"Backlog picker"*, *"Sprint picker"*) | Clicar em **Got it** primeiro |

---

## 📸 Evidência

```
browser_screenshot {
  lesson: "lab-02-boards-backlog-sprints-dashboards-queries",
  slug:   "capacity-configurada",
  alt:    "Capacity do Sprint 1 com 6 horas por dia"
}
```

Grava em `imgs/{lesson}_{NN}_{slug}.png` e devolve o Markdown pronto. O `NN` é calculado lendo a pasta — a sequência continua certa depois de reiniciar o servidor.

| Regra | Motivo |
|---|---|
| `returnImage: false` (padrão) | Imagem no contexto custa milhares de tokens. Use `true` só quando precisar **ver** a tela para decidir o próximo passo |
| Rascunhos vão para `docsDir: "tools/mcp-navegador/state/tmp"` | Fora do repo versionado; apagar no fim |
| `maskAccount` fica ligado | Repositório público |

> 🔒 **Revise antes de commitar.** O mascaramento automático cobre o menu de conta e campos de senha — **não** cobre e-mail no corpo da página, ID de assinatura ou nome de tenant. Já apaguei uma captura por isso.

---

## ✋ O que só você pode fazer

| Ação | Por quê |
|---|---|
| Login e MFA | Zona de bloqueio duro; o servidor não digita credencial |
| **Convidar usuários** | Dispara e-mail real para terceiros |
| Ativar/comprar assinatura Azure | Método de pagamento |
| Aprovar ação de cobrança | Banner na página, botão **Aprovar** |
| Formulário de paralelismo | Ligado à sua conta ([02](02-ativar-agent-pool.md)) |

---

## 🔗 Conexões

| Tema | Onde |
|---|---|
| Índice da formação | [README.md](README.md) |
| O servidor MCP (20 tools, trilhos, config) | [tools/mcp-navegador/README.md](../../../tools/mcp-navegador/README.md) |
| Módulo 1 executado | [lab-01-organizacoes-projetos-e-equipes.md](lab-01-organizacoes-projetos-e-equipes.md) |
| Módulo 2 executado | [lab-02-boards-backlog-sprints-dashboards-queries.md](lab-02-boards-backlog-sprints-dashboards-queries.md) |

---

## 💡 Reflexão Final

A lição que mais economiza tempo aqui não é sobre o Azure DevOps: é que **automatizar uma SPA exige tratar a página como estado instável, não como documento**. O ref que você leu há 200 ms pode não existir mais — e o caso mais comum não é navegação, é o próprio efeito da sua edição (o botão Save renasce como outro nó quando sai de *disabled*).

Daí as três regras que sobraram da prática: **URL direta em vez de clique**, **snapshot com selector em vez da árvore inteira**, e **reler a referência imediatamente antes de agir**. As três juntas transformam uma sequência frágil de 12 passos numa de 4 que funciona sempre.
