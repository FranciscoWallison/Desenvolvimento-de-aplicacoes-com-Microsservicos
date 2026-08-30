# 🧪 Módulo 3 — Repos: Azure DevOps e GitHub + Codespaces

> **Tema:** O ciclo `clone → feature branch → commit → push → Pull Request → merge`, e como o merge no `main` dispara deploy contínuo
> **Pré-requisitos:** [Módulo 1](lab-01-organizacoes-projetos-e-equipes.md) (projeto) · Git na máquina · **assinatura Azure ativa** só para as fases 4–5
> **Conceitos base:** [Devops/Gitflow](../../Gitflow/) (fluxo de branches), [Devops/Gitflow/Commits-Semanticos](../../Gitflow/Commits-Semanticos/)
> **Curso:** Azure Academy — *Azure DevOps & GitHub*, **Turma 14** · Módulo **Repos**
> **Material:** PDF + **lab online** `labs/devops/lab-repos-branch-deploy` — *"Do Clone ao Deploy"*, 50–70 min

---

## 🎯 Objetivo do Módulo

Pegar um app pronto, torná-lo seu e fazer com que **cada merge no `main` publique sozinho**.

```
GitHub público      Azure Repos       Sua máquina        Azure Web App
(app exemplo)       (nosso repo)      (git clone)        (deploy contínuo)
┌───────────┐import ┌──────────┐clone ┌──────────┐push  ┌──────────┐
│hello-world│──────▶│  main    │─────▶│ editar   │─────▶│  no ar 🌐 │
└───────────┘       └──────────┘      │ commit   │      │ atualiza │
                          ▲           └──────────┘      └──────────┘
                          └──── branch linkada ao Web App ────┘
                              (Deployment Center observa a branch)
```

> 💡 **O "pulo do gato" do lab:** o **Deployment Center** do App Service fica observando **uma branch específica**. Todo commit que chega nela dispara build + deploy — sem abrir o portal de novo.

As 5 fases: **Importar → Clonar → Editar → Linkar → Ver no ar**.

---

## 📖 Por que importar em vez de baixar o ZIP

O recurso **Import repository** traz o repositório **inteiro — código + histórico Git** — para dentro do Azure Repos.

> Um ZIP te dá arquivos. O import te dá um **repositório de verdade**: com histórico de commits, do qual você pode clonar, ramificar e abrir PRs.

O lab usa `Azure-Samples/nodejs-docs-hello-world` (público, com `package.json`) e nomeia o destino `meu-hello-app`.

---

## 🧾 Execução registrada

Executado em **29/08/2026** em **dois repositórios**, cobrindo o fluxo duas vezes:

| Repositório | Origem | PR |
|---|---|---|
| **`AzureAcademySITE`** | Site estático já criado no projeto | **#1** — mergeado ✅ |
| **`meu-hello-app`** | **Importado** de `Azure-Samples/nodejs-docs-hello-world`, como o lab manda | **#2** — aberto |

### Preparação — credenciais sem token em arquivo

Antes de clonar, dois ajustes que evitam vazar credencial:

```bash
# Git Credential Manager: guarda no cofre do Windows (DPAPI), não em texto puro
git config --global credential.helper manager

# uma credencial por repositório, em vez de uma só para toda a organização
git config --global credential.https://dev.azure.com.useHttpPath true
```

E no `.gitignore` do caderno de estudos:

```gitignore
Devops/Cloud/Azure-Academy/projetos-repor/
```

> 🔑 **Dois motivos para ignorar a pasta dos clones:** um clone do Azure Repos é um **repositório Git separado** — commitá-lo dentro do caderno criaria um sub-repo quebrado (o Git não versiona o conteúdo, só um ponteiro solto). E o `.git/config` do clone pode acabar guardando credencial na URL do remote.

> 🚨 **Nunca coloque um PAT na URL do remote.** `https://user:TOKEN@dev.azure.com/...` grava o token em texto puro no `.git/config` — e ele vaza em qualquer `git remote -v`, print de tela ou backup. Deixe o Credential Manager cuidar disso.

### Fase 2 — Clonar e criar a feature branch

```bash
git clone https://dev.azure.com/wallisonsousa/AzureAcademy/_git/AzureAcademySITE
cd AzureAcademySITE

# identidade local: casa o commit com a conta do Azure DevOps,
# em vez de usar a identidade global (que aqui é outra conta)
git config user.name  "Wallison Sousa"
git config user.email "seu-email@exemplo.com"

git switch -c feature/ajuste-titulo-e-readme
```

> 💡 **`git config` local (sem `--global`)** vale só neste repositório. Útil quando você tem contas diferentes por contexto — foi o caso aqui: a identidade global do caderno de estudos é outra.

### Fase 3 — Ajuste pontual, commit e push

O lab recomenda **uma mudança pequena e impossível de não notar**. Aqui, o `<title>`:

```diff
- <title>Jovaphile</title>
+ <title>Azure Academy — Site do Lab de Repos</title>
```

Mais a substituição do `README.md` (que era o stub `TODO` gerado pelo Azure DevOps) por objetivo, estrutura e fluxo de contribuição.

Commit no padrão de [commits semânticos](../../Gitflow/Commits-Semanticos/):

```
feat: ajusta titulo do site e documenta o fluxo de contribuicao

- index.html: title de "Jovaphile" para "Azure Academy - Site do Lab de Repos"
- README.md: substitui o stub TODO por objetivo, estrutura e fluxo
  clone -> feature branch -> commit -> PR -> merge

Lab de Azure Repos (Modulo 3) da formacao Azure DevOps & GitHub.
```

```bash
git add README.md index.html
git commit -F mensagem.txt
git push -u origin feature/ajuste-titulo-e-readme
```

### Fase 3b — O Pull Request

![Pull Request 1 aberto da feature branch para main](imgs/lab-03-repos-azure-devops-github-codespaces_01_pull-request-criado.png)

**PR #1** · `feature/ajuste-titulo-e-readme` → `main` · **2 files, 1 commit** · ✅ **No merge conflicts**

Detalhes que valem reparar na tela:

| Elemento | O que faz |
|---|---|
| **Title e Description pré-preenchidos** | Vêm **do commit**. Escrever um bom commit já escreve o PR |
| **Reviewers** (Required / Optional) | Quem precisa aprovar. Branch policy pode tornar obrigatório |
| **Work items** | Liga o PR a um work item — a rastreabilidade *story → commit → PR* que o [Módulo 1](lab-01-organizacoes-projetos-e-equipes.md) prega |
| **Approve** e **Complete** | Aprovar é o sign-off; completar é o merge |
| Abas **Files · Updates · Commits** | Revisão por arquivo, por push e por commit |

> 🔗 **Traceabilidade:** o campo *Work items* é o que fecha o ciclo do curso — um work item se liga ao commit, ao PR e ao build. Aqui ficou vazio de propósito: nenhuma das User Stories do [Módulo 2](lab-02-boards-backlog-sprints-dashboards-queries.md) descreve "mudar o título do site", e **vincular a um item errado é pior que não vincular**.

---

### Fase 1 — Import de verdade (`meu-hello-app`)

*Repos → seletor de repositório → **Import repository***. O diálogo pede só três coisas:

![Diálogo Import a Git repository preenchido com o nodejs-docs-hello-world](imgs/lab-03-repos-azure-devops-github-codespaces_02_import-repository-preenchido.png)

| Campo | Valor |
|---|---|
| Repository type | **Git** |
| Clone URL | `https://github.com/Azure-Samples/nodejs-docs-hello-world` |
| Requires Authentication | **desmarcado** (repositório público) |
| Name | `meu-hello-app` |

O import leva poucos segundos — e o resultado prova a tese do lab:

![Repositório meu-hello-app importado com index.js e package.json](imgs/lab-03-repos-azure-devops-github-codespaces_03_meu-hello-app-importado.png)

> 🔑 **Olhe a coluna de commits:** `LICENSE` de **15/03/2017**, `web.config` de **18/04/2018**, `README.md` de **15/10/2019**, `index.js` de **14/11/2022** — com autores originais (*Microsoft Open Source*, *Cory Fowler*). São **33 commits** de histórico real preservados, o mais antigo de 2017.
>
> Um ZIP daria os mesmos arquivos e **um único commit**. Aqui `git blame`, `git bisect` e "por que essa linha existe?" continuam funcionando.

### 🐞 O roteiro do lab está desatualizado — e vale entender por quê

O lab manda editar assim:

```diff
  server = http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
-   res.end('Hello World
');
+   res.end('Hello Azure Academy — deploy contínuo funcionando! v2
');
  });
```

**Esse código não existe mais no repositório.** O `Azure-Samples/nodejs-docs-hello-world` evoluiu: hoje é uma **API Express** (baseada no projeto *Web Dev For Beginners*), com rotas de contas bancárias e `body-parser`/`cors`. O "Hello World" virou:

```js
app.get('/', function (req, res) {
    return res.send("Hello World!");
})
```

Então o ajuste equivalente é:

```diff
- return res.send("Hello World!");
+ return res.send("Hello Azure Academy - deploy continuo funcionando! v2");
```

> 💡 **A lição que isso ensina de graça:** roteiro de lab que aponta para **repositório público vivo** envelhece sozinho. O `package.json` continua com `"start": "node index.js"`, então o deploy do App Service segue funcionando igual — mas quem seguir o diff ao pé da letra vai procurar uma linha que não existe. Ler o código antes de aplicar o patch é o hábito que salva.

### Fases 2 e 3 no `meu-hello-app`

```bash
git clone https://dev.azure.com/wallisonsousa/AzureAcademy/_git/meu-hello-app
cd meu-hello-app
git config user.name "Wallison Sousa"
git config user.email "seu-email@exemplo.com"
git switch -c feature/mensagem-academy
# edita index.js
git add index.js
git commit -F mensagem.txt
git push -u origin feature/mensagem-academy
```

![Pull Request 2 no repositório meu-hello-app com o ajuste da mensagem](imgs/lab-03-repos-azure-devops-github-codespaces_04_pr-2-meu-hello-app.png)

**PR #2** · `feature/mensagem-academy` → `main` · ✅ sem conflitos.

> 📌 A descrição do PR registra a divergência entre o roteiro e o código atual. Isso é deliberado: **o PR é o lugar certo para explicar por que a mudança não é literalmente a que foi pedida** — quem revisar daqui a seis meses vai entender sem precisar arqueologia.

---

### Fechando o ciclo — o trabalho no Board

O curso repete que o valor do Azure DevOps está na **integração**. Isso só vira verdade quando o trabalho feito no Repos aparece no Boards. Foi o que faltava — e agora está:

```
Epic 10  Plataforma e Entrega
└─ Feature 11  Repositórios e fluxo de contribuição
   ├─ US 12  Importar app de exemplo para o Azure Repos      ✅ Closed
   ├─ US 13  Padronizar README e título do site               ✅ Closed  ← PR #1
   └─ US 14  Ajustar mensagem da home do meu-hello-app        ✅ Closed  ← PR #2
```

![Backlog com o Epic Plataforma e Entrega e as três stories, duas fechadas](imgs/lab-03-repos-azure-devops-github-codespaces_06_board-com-atividades-entregues.png)

> 🔑 **Por que um Epic separado de "Loja Virtual":** o Epic de produto responde *"o que o cliente ganha"*. Trabalho de repositório, fluxo de PR e deploy responde *"como a gente entrega"* — é **plataforma**, não funcionalidade. Misturar os dois num só Epic destrói o rollup: você não consegue mais responder "quanto do produto está pronto?" sem descontar o trabalho de infraestrutura no meio.

O vínculo do PR com a story se faz no painel **Work items** do próprio PR:

![Pull Request 2 vinculado à User Story 14 no painel Work items](imgs/lab-03-repos-azure-devops-github-codespaces_05_pr-2-vinculado-ao-work-item.png)

Com o PR **Completed**, a cadeia fica completa e navegável nos dois sentidos:

```
User Story 14  ←→  PR #2  ←→  commit c7f6bd6d (Merged PR 2)  ←→  branch feature/mensagem-academy
```

> 💡 **O que isso resolve na prática:** daqui a seis meses, `git blame` numa linha do `index.js` leva ao commit, que leva ao PR, que leva à User Story — e aí você descobre **por que** aquela mudança existiu, não só quem a fez. Sem o vínculo, a resposta morre no commit.

---

### Fase 4 — tentativa de criar o Web App

Tentativa real em **29/08/2026**, para registrar o que exatamente bloqueia.

![Formulário Criar Aplicativo Web com a assinatura marcada como Desabilitado](imgs/lab-03-repos-azure-devops-github-codespaces_07_web-app-form-assinatura-desabilitada.png)

O formulário abre e aceita tudo. O que ele **não** esconde é a primeira linha:

> **Assinatura \*** → `(Desabilitado) Azure subscription 1`

O próprio portal prefixa o nome com **`(Desabilitado)`** no dropdown. Não há outra assinatura para escolher, e o campo é obrigatório.

| Campo | Valor usado | Observação |
|---|---|---|
| Nome | `meu-hello-academy` | ✅ disponível (check verde) |
| Publicar | **Código** | Não é contêiner |
| Pilha de runtime | **Node 22 LTS** | ⚠️ o lab pede *Node 20 LTS*, **que não existe mais na lista** |
| Sistema Operacional | **Linux** | Fixado pelo runtime Node |
| Grupo de Recursos | `(Novo) meu-hello-academy_group` | Criado junto |

> 💰 **O bloqueio não é custo.** O plano **F1 é gratuito** — R$ 0,00. O que falta é uma assinatura **ativa** para hospedar o recurso. É um cupom de 100% de desconto com a loja fechada.

> 🔒 **O trilho do MCP também barrou**, antes mesmo da validação do Azure: a regra de domínio *"criação/remoção de recurso no Azure Portal — pode gerar custo e é difícil de reverter"* devolveu um token de confirmação em vez de clicar. Criar recurso em nuvem é exatamente o tipo de ação que exige um humano no circuito.

### Quando a assinatura voltar — o caminho completo

O `meu-hello-app` **já está pronto para deploy**: tem `package.json` com `"start": "node index.js"`, que é tudo que o **Oryx** (build service do App Service) procura para rodar `npm install` e subir.

1. **Criar o Web App** — `portal.azure.com` → *Criar Aplicativo Web*: Código · Node 22 LTS · Linux · região **Brazil South** · plano **F1 (Gratuito)**
2. **Deployment Center** → *Azure Repos* → organização `wallisonsousa` · projeto `AzureAcademy` · repositório **`meu-hello-app`** · branch **`main`**
3. O Azure cria um **pipeline de build** automaticamente e faz o primeiro deploy
4. A partir daí, **todo merge no `main` publica sozinho** — é o "pulo do gato" do lab

> ⚠️ **Atenção ao passo 3:** o build gerado consome um **job paralelo** do Azure Pipelines. Se o paralelismo ainda não tiver sido concedido, o deploy fica na fila com `No hosted parallelism has been purchased or granted` — ver [02-ativar-agent-pool.md](02-ativar-agent-pool.md). São **dois bloqueios independentes**: a assinatura e o grant de paralelismo.

---

## 🐞 Troubleshooting Comum

Os três primeiros aconteceram **nesta execução**:

| Sintoma | Causa | Correção |
|---|---|---|
| `fatal: destination path 'X' already exists and is not an empty directory` | A pasta já tinha um clone | `cd` na pasta e `git pull`, ou apagar antes |
| Mensagem de commit com lixo (`@` na primeira linha) | Sintaxe de *here-string* do PowerShell (`@'…'@`) usada num shell **Bash** | Use heredoc do Bash (`<<'MSG'`) ou `git commit -F arquivo` |
| `TF400813: user is not authorized` | Identidade/tenant errado | Ver [guia de navegação](00-guia-navegacao-mcp.md) |
| `warning: LF will be replaced by CRLF` | `core.autocrlf` no Windows | Normal; para padronizar, use `.gitattributes` com `* text=auto` |
| Push pede login toda vez | Sem credential helper | `git config --global credential.helper manager` |
| Não consigo dar push no `main` | Branch policy exigindo PR | É o comportamento desejado — abra um PR |

### Corrigir a mensagem depois do push

```bash
git commit --amend -F - <<'MSG'
mensagem correta aqui
MSG
git push --force-with-lease origin feature/minha-branch
```

> ⚠️ **`--force-with-lease`, nunca `--force`.** Ele recusa o push se alguém tiver commitado na branch desde o seu último fetch — protege contra sobrescrever trabalho alheio. E **só em feature branch sua**: reescrever histórico de branch compartilhada quebra o clone de todo mundo.

---

## 🧠 Conceitos Aprendidos

| Conceito | Resumo |
|---|---|
| **Import repository** | Traz código **+ histórico** de um repo público; diferente de baixar ZIP |
| **Feature branch** | Isola o trabalho; o `main` fica sempre publicável |
| **Pull Request** | Portão de revisão — title/description saem do commit |
| **Branch policy** | *Require a minimum number of reviewers* impede push direto no `main` |
| **Deployment Center** | Observa **uma branch**; commit nela dispara build + deploy |
| **Oryx** | Build service do App Service: roda `npm install` e o `start` |
| **Git Credential Manager** | Guarda credencial no cofre do SO, não em texto puro |
| **`useHttpPath`** | Uma credencial por repositório, não uma para a organização toda |
| **`git config` local** | Identidade por repositório, sobrepondo a global |
| **`--force-with-lease`** | Force push que respeita commits alheios |

---

## ✅ Quiz Mental

**1. Por que "importar" o repositório em vez de baixar o ZIP e commitar?**

<details>
<summary>Ver resposta</summary>

O ZIP dá **os arquivos no estado atual**; o import traz **o repositório**, com todo o histórico de commits, autores e datas.

Isso importa porque quase tudo em Git depende de histórico: `git blame`, `git bisect`, comparar versões, entender por que uma linha existe. Commitar um ZIP cria um único commit "initial" que apaga a história inteira do projeto.

</details>

**2. Você colocou o PAT na URL do remote e funcionou. Qual o problema?**

<details>
<summary>Ver resposta</summary>

O token fica em **texto puro no `.git/config`** — e vaza em `git remote -v`, em print de tela, num backup da pasta, ou se alguém copiar o diretório.

Pior: um PAT do Azure DevOps **não morre quando você troca a senha da conta**. Ele tem ciclo de vida próprio e só para de funcionar se for **revogado** explicitamente. Um token vazado continua valendo até você ir lá e matá-lo.

O certo é o **Credential Manager**, que guarda no cofre do sistema operacional (no Windows, criptografado por DPAPI) e não deixa rastro no repositório.

</details>

**3. Você errou a mensagem do commit e já deu push. Amend + force push é seguro?**

<details>
<summary>Ver resposta</summary>

**Na sua feature branch, sim** — desde que use `--force-with-lease` e ninguém mais esteja trabalhando nela.

`--force-with-lease` recusa o push se a branch remota avançou desde o seu último fetch, o que protege contra apagar trabalho de outra pessoa. `--force` puro não verifica nada.

**No `main` compartilhado, não.** Reescrever histórico publicado quebra o clone de todo mundo — quem já tinha o commit antigo vai ter conflito na próxima operação. Nesse caso o certo é um commit novo corrigindo.

</details>

---

## 🗺️ Status do Roadmap

| Fase | O que é | Status |
|---|---|---|
| 1 · **Importar** | `nodejs-docs-hello-world` → `meu-hello-app`, com 33 commits de histórico | ✅ |
| 2 · **Clonar** | Clone + feature branch — nos **dois** repositórios | ✅ |
| 3 · **Editar** | Ajuste, commit semântico, push, PR | ✅ **PR #1 mergeado** · **PR #2 aguardando Approve + Complete** |
| 4 · **Linkar** | Web App F1 + Deployment Center | 🔴 **Bloqueado por quota** — ver abaixo |
| 5 · **Ver no ar** | Push dispara deploy | 🔴 **Bloqueado** (depende da fase 4) |

### 🚧 O bloqueio real da fase 4: quota zerada na assinatura (30/08/2026)

O grupo de recursos `AzureAcademy` foi criado e o formulário do Web App foi preenchido inteiro — **Node 22 LTS · Linux · plano Gratuito F1**. Na hora do *Criar*, o Azure devolveu:

```text
Operation cannot be completed without additional quota.
Additional details - Location:
Current Limit (Total VMs): 0
Current Usage: 0
Amount required for this deployment (Total VMs): 1
(Minimum) New Limit that you should request to enable this deployment: 1
```

![Erro de quota no Criar do Web App: Current Limit (Total VMs) 0](imgs/lab-03-repos-azure-devops-github-codespaces_08_quota-total-vms-zero.png)

**Testado em duas regiões — Brazil South e East US 2 — com o mesmo erro.** Isso descarta a hipótese de região e aponta para a **assinatura**: `Azure subscription 1` (`057d3c78-…`) está com **limite de compute igual a 0**.

| Sintoma | O que NÃO é | O que provavelmente é |
|---|---|---|
| `Current Limit (Total VMs): 0` em toda região testada | Falta de crédito — a assinatura está **Ativa** e já hospeda Synapse, Data Lake e 2 Static Web Apps | Quota de vCPU **resetada para 0** quando a assinatura foi desabilitada e depois reativada |
| Acontece até no **F1 gratuito** | Preço — o F1 custa US$ 0,00 | Quota ≠ cobrança: o App Service Plan reserva capacidade de VM, e a **reserva** é que está barrada |

> 🔑 **Quota e cobrança são coisas diferentes.** Um plano F1 não custa nada, mas ainda assim **reserva** uma instância de computação — e reserva conta contra a quota de vCPU da assinatura na região. Com limite 0, nem o gratuito passa. É o mesmo motivo pelo qual [o grant de paralelismo](02-ativar-agent-pool.md) é independente do pagamento: **capacidade e fatura são trilhos separados** na Azure.

**Dois caminhos para destravar:**

1. **Usar a outra assinatura.** A conta tem duas ativas — `Assinatura 1` (`3b5abea2-…`) nunca foi desabilitada, então deve ter quota normal. Custo: recriar o grupo `AzureAcademy` nela.
2. **Pedir aumento de quota.** A própria faixa vermelha do erro tem uma seta `→` que abre *Solicitar aumento de cota*. Para 1 vCPU o pedido costuma ser automático, mas pode levar horas.

### 🔜 Onde a aula parou — e o gancho para o Módulo 4

1. ~~Grupo de recursos `AzureAcademy`~~ — ✅ **criado em 30/08/2026** (Brazil South)
2. **Web App do `meu-hello-app`** com Deployment Center na branch `main`, **gerando o link no ar** — travado na quota acima
3. **IaC a partir de `Grupos de recursos → AzureAcademy → Implantações`**

> 🔑 **O item 3 é o pulo do gato do Módulo 4.** Toda implantação feita pelo portal fica registrada no menu **Implantações** do grupo de recursos — e cada uma expõe o **Modelo (ARM template)** com os parâmetros que o Azure gerou.
>
> Ou seja: você **não escreve ARM do zero**. Cria pelo portal uma vez, exporta o template, commita no Repos e passa a reimplantar por código. O portal vira a ferramenta de autoria do IaC — e é exatamente a ponte entre este módulo (Repos) e o próximo (Infra as Code).

### Também não executado

- **Proteger o `main`** com branch policy (*Project settings → Repositories → main → Policies → Require a minimum number of reviewers*) — o lab marca como opcional, mas é o que torna o fluxo por PR obrigatório em vez de voluntário
- **Codespaces** (parte do título do módulo, ausente do lab online)

---

## 🔗 Conexões

| Tema | Onde |
|---|---|
| Índice da formação | [README.md](README.md) |
| Como dirigir o portal | [00-guia-navegacao-mcp.md](00-guia-navegacao-mcp.md) |
| Fluxo de branches e commits semânticos | [Devops/Gitflow](../../Gitflow/) |
| Projeto e equipes | [lab-01-…](lab-01-organizacoes-projetos-e-equipes.md) |
| Work items para vincular no PR | [lab-02-…](lab-02-boards-backlog-sprints-dashboards-queries.md) |
| Agent pool (necessário para o build do deploy) | [02-ativar-agent-pool.md](02-ativar-agent-pool.md) |

---

## 💡 Reflexão Final

O módulo mostra o Azure Repos como "Git com portal em volta", e a parte realmente interessante é **onde o portal adiciona valor que o Git puro não tem**: o Pull Request é um objeto de primeira classe que carrega revisores, políticas, work items e status de build. O `git merge` faz o mesmo tecnicamente — e não registra **nada** sobre quem revisou, o que foi discutido, ou qual requisito aquilo atendia.

E a lição que ficou desta execução não estava no roteiro: **credencial é parte do fluxo, não um detalhe de setup.** O caminho fácil — token na URL do remote — funciona de primeira e deixa um segredo em texto puro num arquivo que ninguém mais olha. O caminho certo custa dois `git config` e resolve para sempre. A diferença entre os dois só aparece no dia em que o repositório vaza — e aí já é tarde.
