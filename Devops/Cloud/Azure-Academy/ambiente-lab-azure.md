# 🧱 Ambiente de laboratório — montar do zero e destruir

> **Tema:** provisionar todo o ambiente Azure + Azure DevOps usado nos Módulos 3 a 6, de forma reprodutível
> **Pré-requisitos:** conta Microsoft com assinatura Azure ativa · organização no Azure DevOps
> **Conceitos base:** Azure CLI · resource providers · quota vs. cobrança · service connection · free tiers
> **Escrito a partir de:** execução real em 30/08/2026 — cada armadilha aqui foi encontrada na prática, não copiada de documentação

---

> 🟢 **Estado em 30/08/2026: ambiente DESTRUÍdo.** Os grupos de recursos `AzureAcademy` foram apagados nas duas assinaturas ao fim do estudo. Custo do Azure em **R$ 0**. Este documento existe justamente para remontá-lo em ~10 minutos quando você voltar.
>
> ✅ **Em 31/08/2026 o último item pago também caiu:** os jobs paralelos do Azure DevOps foram zerados (`Paid parallel jobs = 0` nos dois), e o **grant gratuito entrou no lugar** — a organização agora tem *1 job Microsoft-hosted com 1.800 min/mês* + *1 self-hosted*, de graça. As pipelines do curso continuam rodando. Custo recorrente do estudo: **R$ 0**, com **orçamento de R$ 30/mês** ativo como rede de segurança. Ver [README](README.md) e **[custos-desligamento-e-validacao.md](custos-desligamento-e-validacao.md)**.

---

## 🎯 Para que serve este documento

Os labs da formação criam recursos que **custam dinheiro parados**. A estratégia que funciona é:

> **provisionar → estudar → destruir → repetir quando precisar**

Este documento é o script dessa rotina. Ele existe porque a primeira montagem levou horas — quase toda gasta em bloqueios que **não estão em nenhum material do curso**. A segunda leva ~10 minutos.

---

## 📦 O que o ambiente contém

```
Azure (assinatura)                         Azure DevOps (organização)
└─ RG: AzureAcademy                        ├─ Service connection: Azure-AzureAcademy
   ├─ plan-academy-b1 ......... B1 Win     ├─ Build: AzureAcademy-CI ──► artefato 'drop'
   │  ├─ academy-mvc-wsousa ... prod       └─ Release: MVC
   │  ├─ ...-dev                              ├─ DEV      → ...-dev  + task Azure CLI
   │  └─ ...-test                             ├─ TEST     → ...-test
   ├─ sql-academy-wsousa                      └─ PRODUCAO → prod  🔒 approval
   │  └─ AzureAcademyDB ....... free limit
   └─ auto-academy-wsousa ..... Free
      └─ runbook sqlescala
```

| Componente | Custo |
|---|---|
| App Service Plan **B1** | **~R$ 2,30/dia** — a cobrança é por **plano**, não por app; os 3 web apps dividem o mesmo |
| SQL Database (free limit) | **R$ 0** |
| Automation Account (Free) | **R$ 0** |
| Service connection · pipelines | **R$ 0** |
| **Total** | **~R$ 2,30/dia** |

> 💡 O Azure DevOps tem custo próprio e **independente**: 1 job paralelo Microsoft-hosted ≈ US$ 40/mês. Ver a seção 💰 Custos do [README](README.md). Destruir o RG **não** mexe nisso.

---

## 🚀 Montar

### Pré-requisitos, uma vez só

```powershell
winget install Microsoft.AzureCLI
az login --use-device-code          # abre login.microsoft.com/device
az extension add --name automation
```

> ⚠️ O `winget` pode falhar com `InternetOpenUrl() failed` se estiver rodando num shell com sandbox de rede. Rode num terminal normal.

### Rodar

```powershell
cd Devops/Cloud/Azure-Academy/scripts
.\provisionar-lab-azure.ps1
```

O script é parametrizado — troque `-SubscriptionId`, `-Prefix` etc. se for reaproveitar em outra conta. Ele:

1. Registra os **resource providers** (`Microsoft.Web`, `Microsoft.Sql`, `Microsoft.Automation`)
2. Cria o grupo, o plano B1 Windows e os 3 web apps
3. Gera uma senha aleatória, grava em `%TEMP%` e cria o SQL Server
4. Cria o banco **na oferta gratuita**
5. Abre o firewall para serviços do Azure e para o seu IP
6. Cria a Automation Account, a variável criptografada `SqlPass` e publica o runbook `sqlescala`

### Destruir

```powershell
.\destruir-lab-azure.ps1              # prévia: só lista
.\destruir-lab-azure.ps1 -Confirmar   # apaga de verdade
```

---

## 🪤 Armadilhas — o que custou horas

Esta é a parte que não está no material do curso.

### 1. Quota de compute = 0 nas Américas

```
ERROR: Operation cannot be completed without additional quota.
Current Limit (Total VMs): 0
Amount required for this deployment (Total VMs): 1
```

Testado exaustivamente:

| Tier | Brazil South | East US | East US 2 | West Europe |
|---|---|---|---|---|
| F1 (grátis) | ❌ | ❌ | ❌ | ✅ |
| B1 | ❌ | — | — | ✅ |
| **S1 (Standard)** | ❌ | — | — | ❌ |

E o mesmo nas **duas** assinaturas da conta. Ambas são `PayAsYouGo_2014-09-01` com `spendingLimit: Off` — ou seja, **não é falta de crédito**.

> 🔑 **Quota ≠ cobrança.** Um plano F1 custa US$ 0,00 mas ainda assim **reserva** uma instância de computação — e reserva conta contra a quota de vCPU da assinatura naquela região. Com limite 0, nem o gratuito passa. É a mesma lógica do grant de paralelismo do Pipelines ser independente do pagamento: **capacidade e fatura são trilhos separados na Azure**.

### 2. Standard+ bloqueado em toda região

```
ERROR: The subscription '...' is not allowed to create or update the serverfarm.
```

Mensagem **diferente** da anterior, e independente de região — falha até em West Europe, onde o B1 funciona. É a restrição antifraude da Microsoft para conta PayAsYouGo nova.

**Consequência direta:** *deployment slots exigem Standard*. Provado empiricamente:

```
ERROR: Cannot complete the operation because the site will exceed
       the number of slots allowed for the 'Basic' SKU.
```

Então o **lab de swap blue/green do Módulo 6 não roda nesta conta**. A variante deste ambiente usa **3 web apps em vez de 3 slots** — perde o swap, mantém todo o resto do CD.

Para destravar: abrir chamado de aumento de cota (gratuito) pedindo Standard.

### 3. `--is-linux false` é obrigatório

Sem a flag, o `az appservice plan create` cria plano **Linux** — mesmo sem você pedir. E aí a app ASP.NET Framework não roda.

```powershell
az appservice plan create ... --is-linux false
```

### 4. Runtime com dois-pontos, não pipe

```powershell
--runtime 'ASPNET:V4.8'   # ✅
--runtime 'ASPNET|V4.8'   # ❌ 'V4.8' não é reconhecido como um comando interno
```

O `az` no Windows é um `.cmd` que passa por `cmd.exe`; o `|` vira pipe de shell.

### 5. Senha com caractere especial quebra o `az.cmd`

O mesmo problema, agora com credencial. Uma senha gerada com `( ) ! @ &` fez o `cmd.exe` engasgar — e **a senha apareceu no stack trace do erro**. Foi descartada e o servidor recriado.

O script usa charset restrito (`a-z A-Z 0-9 - _ .`) por isso.

> 🐞 **Bônus de PowerShell 5.1:** `('a'..'z')` **não** gera letras — tenta converter `"a"` para `Int32` e falha. Use uma string literal com `.ToCharArray()`.

### 6. Nome de plano fica reservado após falha

Depois de um `create` que falhou, o nome continua ocupado por um tempo:

```
ERROR: (InvalidResourceLocation) The resource 'plan-azureacademy' already exists
       in location 'brazilsouth' ... A resource with the same name cannot be
       created in location 'westeurope'.
```

E `az resource list` mostra o grupo **vazio**. É registro fantasma — use outro nome ou espere.

### 7. Providers não registrados

Assinatura nova vem com `Microsoft.Sql` e `Microsoft.Automation` em `NotRegistered`. O erro que aparece não menciona registro nenhum. O script registra antes de tudo.

### 8. `az automation` é extensão e é experimental

```powershell
az extension add --name automation
```

Sem ela o comando trava pedindo confirmação interativa e morre com `EOFError`. Os comandos ainda avisam *"Command group 'automation account' is experimental"*.

> Curiosidade: pedi `--sku Free` e a API devolveu `sku: Basic`. O tier gratuito da Automation (500 min/mês) é aplicado por consumo, não pelo nome do SKU.

---

## 🔧 Lado Azure DevOps

Esta parte **não dá para automatizar sem um PAT**, e PAT em script é credencial versionada. São passos de interface, uma vez só.

### 1. Service connection (gratuita — faça primeiro)

`Project settings → Service connections → New → Azure Resource Manager`

| Campo | Valor |
|---|---|
| Identity type | **App registration (automatic)** |
| Credential | **Workload identity federation** |
| Scope level | Subscription |
| Subscription | a sua |
| Nome | `Azure-AzureAcademy` |

> 🔑 **Ela é o gargalo de tudo.** Sem service connection, a task *Azure App Service Deploy* não consegue nem listar os App Services — o campo fica vazio e **o pipeline não salva**. É o primeiro item de qualquer checklist de CD no Azure, e não gera nenhum recurso cobrável: é só um service principal no Entra com papel Contributor.

### 2. Release pipeline

`Pipelines → Releases → New pipeline → template "Azure App Service deployment"`

| Stage | Gatilho | App service name |
|---|---|---|
| **DEV** | After release | `academy-mvc-wsousa-dev` |
| **TEST** | **After stage → DEV** | `academy-mvc-wsousa-test` |
| **PRODUCAO** | **After stage → TEST** + 🔒 aprovação | `academy-mvc-wsousa` |

Artefato: **Build** → `AzureAcademy-CI` → com o **gatilho de CD** (⚡) ligado.

### 3. Chamar o runbook a partir do pipeline

A extensão clássica **"Call an Automation Runbook" foi descontinuada** — buscando `runbook` no marketplace sobram 3 extensões de terceiros com 469, 23 e 15 instalações.

Use a task **Azure CLI**, que é nativa:

| Campo | Valor |
|---|---|
| Connection Type | Azure Resource Manager |
| Connection | `Azure-AzureAcademy` |
| Script Type | **PowerShell Core** |
| Script Location | **Inline script** |
| Inline Script | `az automation runbook start --resource-group AzureAcademy --automation-account-name auto-academy-wsousa --name sqlescala --parameters EDITION=standard SERVICE_OBJECTIVE=S0` |

> 💡 Melhor que a extensão em três aspectos: sem dependência de terceiro abandonável, reaproveita a service connection que já existe, e é a mesma abordagem que o PDF do Módulo 6 já usa nos runbooks do Front Door.

### 🐞 Armadilhas do editor clássico de release

| Armadilha | Detalhe |
|---|---|
| **`Save` fica cinza** | Enquanto **qualquer** input obrigatório estiver vazio em **qualquer** stage. Não há mensagem dizendo qual |
| **Navegar descarta tudo** | Trocar de aba pela URL com alterações não salvas **perde o trabalho inteiro**. Salve a cada stage |
| **Artefato é imutável** | O campo *Source (build pipeline)* trava depois de criado. Para trocar, tem que remover e readicionar |
| **Dropdown mente calado** | Digitei `AzureAcademy-CI` + `Enter` e ele selecionou **`build`** — outro pipeline. Só descobri conferindo pela API. **Sempre confira o resultado** |

### Conferir pela API em vez da tela

Muito mais rápido e confiável que screenshot:

```
GET https://vsrm.dev.azure.com/{org}/{projeto}/_apis/release/definitions/{id}?api-version=7.1
GET https://dev.azure.com/{org}/{projeto}/_apis/serviceendpoint/endpoints?api-version=7.1-preview.4
GET https://dev.azure.com/{org}/{projeto}/_apis/build/builds/{id}/timeline?api-version=7.1
```

---

## 💰 Manter o custo em zero

| Recurso | Como fica grátis |
|---|---|
| **SQL Database** | `--use-free-limit` → 100.000 vCore-s/mês + 32 GB, **um por assinatura**. `--free-limit-exhaustion-behavior AutoPause` pausa em vez de cobrar |
| **Automation** | Free tier: 500 min de execução/mês |
| **Web Apps** | Não têm como ser grátis aqui — F1 é bloqueado por quota. B1 é o mínimo viável |
| **Azure DevOps** | Grátis até 5 usuários Basic. **O job paralelo é que custa** |

### 🔴 O que faz o custo explodir

1. **Rodar o `sqlescala` com os parâmetros do lab.** `EDITION=standard SERVICE_OBJECTIVE=S0` são do modelo **DTU**; o banco está em **vCore Serverless com free limit**. Executar **tira o banco da oferta gratuita permanentemente** — e é uma por assinatura. Para testar o mecanismo sem custo, use `SERVICE_OBJECTIVE=GP_S_Gen5_4`, que escala dentro do próprio serverless.
2. **Esquecer o B1 ligado.** R$ 2,30/dia vira R$ 70/mês. Coloque no calendário.
3. **O job paralelo do Pipelines.** ~R$ 210/mês, cobrança **diária pró-rata** — zerar em `_settings/billing` para de cobrar no mesmo dia.

---

## 🐞 Troubleshooting Comum

| Sintoma | Causa | Onde olhar |
|---|---|---|
| `Current Limit (Total VMs): 0` | Quota regional zerada | Tente West Europe; ou peça aumento de cota |
| `not allowed to create or update the serverfarm` | Standard+ bloqueado na conta | Use B1; abra chamado para liberar Standard |
| `will exceed the number of slots allowed for the 'Basic' SKU` | Slots exigem Standard | Use web apps separados |
| `'V4.8' não é reconhecido como um comando interno` | Pipe no `--runtime` | Use `ASPNET:V4.8` |
| `PasswordTooShort` mesmo com senha longa | Geração falhou silenciosamente | `('a'..'z')` não funciona no PS 5.1 |
| `already exists in location X` com RG vazio | Nome reservado por falha anterior | Outro nome, ou aguarde |
| `EOFError` no `az automation` | Extensão não instalada, prompt interativo | `az extension add --name automation` |
| Task de deploy sem App Service na lista | Sem service connection | `Project settings → Service connections` |
| `Save` cinza no release | Input obrigatório vazio em algum stage | Percorra os 3 stages |
| `Cannot open server` no SQL | Seu IP mudou | Recrie a regra de firewall |

---

## 🧠 Conceitos Aprendidos

- **Quota e cobrança são sistemas independentes.** O gratuito pode ser barrado por capacidade; o pago pode ser barrado por antifraude. Ler a mensagem literal importa: `Total VMs: 0` e `not allowed to... serverfarm` são problemas **diferentes** com soluções diferentes.
- **Tier não é só preço, é catálogo de recursos.** Escolher Basic para economizar **elimina** deployment slots — e com isso, blue/green. Preço e capacidade técnica vêm no mesmo pacote.
- **Service connection é identidade, não conectividade.** Um service principal no Entra com papel na assinatura. Por isso é o primeiro item da checklist — sem ela nada de deploy se configura.
- **`0.0.0.0` no firewall do SQL não é curinga de internet.** É o marcador "serviços do Azure" — inclusive de outras assinaturas, de outras pessoas. Para produção, Private Endpoint.
- **Credencial em runbook é vazamento por design.** Runbook é legível por quem tem acesso à conta. Variável criptografada ou Key Vault.
- **Interface mente; API não.** O editor clássico selecionou o artefato errado sem avisar. Conferir pela REST API é mais rápido e mais confiável.
- **Shell é parte do sistema.** Metade das falhas aqui foram de *quoting* — pipe no runtime, caractere especial na senha, barra invertida escapando aspa ([lab-05](lab-05-pipelines-build-classica.md)). Em Windows + `az.cmd` + `cmd.exe`, o charset importa tanto quanto a lógica.

---

## ✅ Quiz Mental

<details>
<summary>O plano F1 é gratuito. Por que a criação falha por quota?</summary>

Porque **quota mede capacidade reservada, não dinheiro**. Um App Service Plan — mesmo F1 — reserva uma instância de computação, e essa reserva conta contra a quota de vCPU da assinatura naquela região. Com limite 0, nada passa: nem o grátis.

É a mesma separação que faz o grant de paralelismo do Azure Pipelines ser independente de você ter pago a assinatura.

</details>

<details>
<summary>Por que criar a service connection antes de resolver a quota?</summary>

Porque ela é **gratuita** e destrava toda a **configuração** do release, que é independente da existência dos recursos.

Com ela pronta, você monta e salva os 3 stages enquanto espera o aumento de cota. Sem ela, a task de deploy não lista App Service nenhum, o campo obrigatório fica vazio, e o editor clássico **se recusa a salvar**.

</details>

<details>
<summary>O runbook roda e o banco continua no free limit. Certo ou errado?</summary>

**Errado — e caro.** `ALTER DATABASE ... MODIFY (EDITION='standard', SERVICE_OBJECTIVE='S0')` move o banco do modelo **vCore Serverless** para o modelo **DTU**. A oferta gratuita não acompanha, e é **uma por assinatura**: você não recupera criando outro banco.

O equivalente seguro é escalar dentro do próprio serverless: `SERVICE_OBJECTIVE='GP_S_Gen5_4'`.

</details>

<details>
<summary>Por que três web apps em vez de três slots?</summary>

Porque **slots exigem Standard**, e Standard está bloqueado nesta conta. Testado: `Cannot complete the operation because the site will exceed the number of slots allowed for the 'Basic' SKU`.

O que se perde: o **swap** — e com ele o rollback instantâneo e o warm-up. O que se mantém: artefato, gatilho de CD, encadeamento de stages por `environmentState`, aprovações e gates. Ou seja, todo o Módulo 6 menos o mecanismo de troca.

</details>

<details>
<summary>Destruir o grupo de recursos zera todo o custo do curso?</summary>

**Não.** Zera o custo do **Azure**. O **Azure DevOps** cobra à parte — o job paralelo Microsoft-hosted (~R$ 210/mês) vive em `dev.azure.com/{org}/_settings/billing` e sobrevive à exclusão do RG.

A boa notícia: a cobrança dele é **diária pró-rata**, então baixar para 0 para de cobrar no mesmo dia.

</details>

---

## 🗺️ Status do Roadmap

| Item | Estado |
|---|---|
| Script de provisionamento | ✅ [`scripts/provisionar-lab-azure.ps1`](scripts/provisionar-lab-azure.ps1) |
| Runbook parametrizado | ✅ [`scripts/sqlescala.ps1`](scripts/sqlescala.ps1) |
| Script de destruição | ✅ [`scripts/destruir-lab-azure.ps1`](scripts/destruir-lab-azure.ps1) |
| Service connection + release | 📋 documentado (passos de interface) |
| Automatizar o lado DevOps | 🔜 exigiria PAT — avaliar `az devops` com login federado |
| Aumento de cota para Standard | 🔜 destrava slots e o swap de verdade |
| Front Door zero-downtime | 🔜 custo adicional (~US$ 35/mês) |

---

---

## 📚 Leitura complementar

| Livro | Onde | Por quê |
|---|---|---|
| **#01** *Fundamentals of Azure* | cap. 8 — Management tools | CLI, portal e ARM como formas de gerenciar |
| **#05** *Guia do desenvolvedor do Azure* (pt-BR) | livro todo | Panorama curto e em português |

> Acervo completo e critério de uso em **[bibliografia.md](bibliografia.md)**. Os arquivos ficam em `materiais/livros/`, fora do controle de versão.

## 🔗 Conexões

| Tema | Onde |
|---|---|
| Índice da formação e custos | [README.md](README.md) |
| A app que é implantada | [Anatomia do `build_mvc`](projeto-build-mvc.md) |
| O build que gera o artefato | [lab-05](lab-05-pipelines-build-classica.md) |
| Conceitos de CD, slots e gates | [lab-06](lab-06-release-cd-slots-e-logic-apps.md) |
| Onde a quota apareceu primeiro | [lab-03](lab-03-repos-azure-devops-github-codespaces.md) |
| IaC com ARM | [lab-04](lab-04-iac-arm-e-automacoes.md) |
| Dirigir o portal pelo MCP | [00-guia-navegacao-mcp.md](00-guia-navegacao-mcp.md) |

---

## 💡 Reflexão Final

O que este documento realmente registra não é "como criar um App Service" — isso está na documentação da Microsoft. É **o atrito entre o roteiro do curso e uma conta real**.

O material do curso pressupõe uma assinatura sem restrições: cria S1, cria slots, faz swap. Numa conta PayAsYouGo nova, três dessas quatro coisas são bloqueadas — e as mensagens de erro não explicam por quê. `Total VMs: 0` não diz "sua conta é nova"; `not allowed to create or update the serverfarm` não diz "peça aumento de cota".

Descobrir isso exigiu testar tier por tier, região por região. É por isso que a matriz da seção *Armadilhas* vale mais que o script: o script você reescreve em dez minutos; o mapa dos bloqueios custou horas.

E fica a lição de método: quando a ferramenta gráfica falha em silêncio — artefato errado selecionado, `Save` cinza sem motivo aparente — **a API é a fonte da verdade**. Metade dos erros deste ambiente só apareceu porque eu conferi o JSON em vez de acreditar na tela.
