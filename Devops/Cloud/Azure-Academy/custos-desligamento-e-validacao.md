# 💰 Custos, desligamento e validação — FinOps do laboratório

> **Tema:** onde o dinheiro sai num lab de Azure + Azure DevOps, como desligar cada torneira e **como provar que desligou**
> **Pré-requisitos:** [Ambiente de laboratório](ambiente-lab-azure.md) · Azure CLI autenticado (`az login`)
> **Conceitos base:** preço fixo vs. por uso vs. por provisionamento · free tier vs. compra · cobrança pró-rata diária · quota vs. cobrança · auto-pause
> **Curso:** Azure Academy — Azure DevOps & GitHub · transversal a todos os módulos
> **Escrito a partir de:** o desligamento real executado em 31/08/2026, que cortou **≈ R$ 383/mês**

---

## 🎯 Objetivo

Nenhum módulo do curso ensina isto, e é o que mais dói depois: **um lab que você esquece ligado custa dinheiro todo mês, em silêncio.**

Este documento responde três perguntas, sempre nessa ordem:

1. **Onde sai dinheiro?** — o modelo de cobrança de cada recurso que os labs criam
2. **Como desligo?** — o comando ou o clique exato
3. **Como eu provo que desligou?** — o comando de verificação, porque *achar* que desligou não vale nada

> 🔑 **A terceira pergunta é a que ninguém faz.** Desligar sem validar é como fazer deploy sem teste de fumaça. Neste próprio ambiente, um job paralelo continuou cobrando ~R$ 210/mês **por dias** depois que o benefício gratuito que o substituiria já estava disponível — ninguém tinha olhado a tela que provava isso.

---

## 📐 O conceito central: três modelos de cobrança

Antes de qualquer comando, é preciso saber **qual pergunta fazer** sobre cada recurso. Todo serviço do Azure cai em um destes três:

| Modelo | Cobra por | Ficar parado custa? | Como se desliga |
|---|---|---|---|
| **Preço fixo** (assinatura/tier) | existir, por hora ou por mês | 🔴 **Sim, integral** | Trocar de tier ou cancelar |
| **Por uso** (consumo) | requisição, token, GB, execução | 🟢 Não | Nada a fazer — já é R$ 0 |
| **Por provisionamento** | capacidade reservada, mesmo ociosa | 🔴 **Sim, integral** | Desprovisionar / pausar |

E a regra prática que sai disso:

> 🔑 **Preço fixo é mais perigoso que preço por uso.** O instinto engana: você olha um cluster Spark e fica com medo; olha uma Static Web App e ignora. Neste ambiente o **Spark pool custava R$ 0** (auto-pause de 15 min) e **duas Static Web Apps discretas custavam R$ 94/mês paradas**. O que sangra é o preço fixo, porque ele cobra igual usando ou não.

### Um quarto caso que confunde: quota ≠ cobrança

Aparece o tempo todo neste curso e merece destaque, porque **as duas coisas usam a palavra "limite"**:

| | **Quota** | **Cobrança** |
|---|---|---|
| O que é | Quantos recursos você **pode** criar | Quanto você **paga** pelo que criou |
| Quem controla | Capacidade da região + antifraude | Sua assinatura e método de pagamento |
| Mensagem típica | `Current Limit (Total VMs): 0` | `spendingLimit: Off` |
| Aumentar custa? | Não — é um pedido de suporte | Sim, por definição |

Nesta conta as duas assinaturas são `PayAsYouGo_2014-09-01` com `spendingLimit: Off` — **crédito não é o problema** — e mesmo assim o App Service recusa criar até no tier **F1 gratuito** em Brazil South. Detalhes em [lab-03](lab-03-repos-azure-devops-github-codespaces.md).

E há um refinamento que custou uma tarde: **App Service e VM têm contadores de quota diferentes.** O `Total VMs: 0` do App Service é um contador de *server farm*; `az vm list-usage` mostrava 10 vCPUs livres na mesma conta. Uma quota zerada **não** implica a outra.

---

## 💸 O mapa de preços dos labs

Valores de referência de 08/2026, região Brazil South, câmbio ~R$ 5,25/US$. **Sempre confira na [calculadora oficial](https://azure.microsoft.com/pricing/calculator/)** — preço muda.

### Azure DevOps

| Item | Grátis | Pago | Modelo |
|---|---|---|---|
| **MS-hosted parallel job** (privado) | **1 job, 1.800 min/mês** | ≈ US$ 40/mês por job extra | 🔴 fixo |
| **Self-hosted parallel job** (privado) | **1 job, minutos ilimitados** | ≈ US$ 15/mês por job extra | 🔴 fixo |
| MS-hosted (projeto **público**) | 10 jobs | — | — |
| Self-hosted (projeto **público**) | ilimitado | — | — |
| **Basic users** | 5 usuários | ≈ US$ 6/usuário/mês | 🔴 fixo |
| **Basic + Test Plans** | 0 (trial 30 dias) | **≈ US$ 52/usuário/mês** | 🔴 fixo |
| **Artifacts** | 2 GiB | ≈ US$ 2/GiB/mês | 🟡 por uso |
| **GitHub-hosted agents** | — | por minuto | 🟢 por uso |

> 💰 **Test Plans é o item mais caro do Azure DevOps** — bem acima do job paralelo. Se ativar o trial, marque a data de cancelamento no calendário. Ver [lab-08](lab-08-testes-manuais-e-automatizados.md).

### Azure — o que os labs criam

| Recurso | Tier do lab | Custo parado | Modelo | Observação |
|---|---|---|---|---|
| **App Service Plan** | F1 | **R$ 0** | 🟢 grátis | 60 min CPU/dia, sem slots, sem domínio custom |
| | B1 | ≈ US$ 13/mês | 🔴 fixo | Cobra **por plano**, não por app |
| | S1 | ≈ US$ 70/mês | 🔴 fixo | **Único que dá deployment slots** |
| **Static Web App** | Free | **R$ 0** | 🟢 grátis | 100 GB banda, sem SLA, sem staging |
| | Standard | ≈ US$ 9/**app**/mês | 🔴 fixo | Linked backends, staging, auth custom, SLA |
| **Azure SQL** | Free offer (GP_S_Gen5) | **R$ 0** | 🟢 grátis | 1 por assinatura, `--use-free-limit` |
| | DTU Basic | ≈ US$ 5/mês | 🔴 fixo | |
| **Automation Account** | Free | **R$ 0** | 🟢 grátis | 500 min de runbook/mês |
| **VM** | B1s | ≈ US$ 9/mês | 🔴 fixo | **Desalocada** custa só o disco |
| **Managed disk** | 32 GB | ≈ US$ 2–5/mês | 🔴 fixo | **Sobrevive à VM desalocada** |
| **Storage account** | LRS Hot | centavos/GB | 🟢 por uso | |
| **Logic App** | Consumption | ≈ US$ 1/mês | 🟡 por uso **+ polling** | Ver armadilha abaixo |
| **Synapse Spark pool** | Small, auto-pause | **R$ 0** | 🟢 por uso | Se auto-pause estiver **ligado** |
| **Azure AI / OpenAI** | SKU **Standard** | **R$ 0** | 🟢 por token | |
| | SKU **Provisioned (PTU)** | 🔴 **caro, fixo** | 🔴 provisionado | Cobra por reservar capacidade |

> ⚠️ **A armadilha do App Service Plan.** Ele cobra **por plano**, não por web app. Três web apps num plano B1 custam o mesmo que um. Foi exatamente isso que permitiu substituir os 3 *slots* do Módulo 6 por 3 *web apps* sem custo extra — ver [lab-06](lab-06-release-cd-slots-e-logic-apps.md).

> ⚠️ **A armadilha da VM desalocada.** `az vm deallocate` para de cobrar o *compute*, mas o **disco continua cobrando**. VM parada não é VM grátis. Para zerar de verdade, apague o grupo de recursos.

> ⚠️ **A armadilha do Logic App.** Consumption cobra por **ação executada** *e* por **verificação de gatilho** — inclusive as que não disparam nada. Um gatilho de polling em blob a cada minuto são ~43.000 verificações/mês cobradas, mesmo com zero arquivo chegando. É pouco dinheiro, mas é dinheiro por **nada acontecer**.

---

## 🔧 Como desligar cada coisa — e como validar

O padrão é sempre o mesmo: **um comando que desliga, um comando que prova.**

### 1. Jobs paralelos do Azure DevOps — o item mais caro do curso

**🔴 Antes de desligar, confirme que o benefício gratuito existe.** Esta é a ordem que evita travar as pipelines:

```
https://dev.azure.com/<org>/_settings/buildqueue?_a=concurrentJobs
```

Tem que aparecer, sob *Microsoft-hosted*:

```
Free tier — 1 parallel job up to 1800 mins/mo
```

**Sem essa linha, não zere** — as pipelines param com `No hosted parallelism has been purchased or granted`.

**Desligar** (só pela tela — não há CLI para isso):

```
https://dev.azure.com/<org>/_settings/billing
  → MS Hosted CI/CD   → Paid parallel jobs = 0
  → Self-Hosted CI/CD → Paid parallel jobs = 0
  → Save
```

**Validar** — voltar à tela de parallel jobs e conferir os três sinais:

| Sinal | Valor esperado |
|---|---|
| `Monthly purchases` (MS-hosted) | **0** |
| `Monthly purchases` (self-hosted) | **0** |
| Linha do free tier | `Free tier — 1 parallel job up to 1800 mins/mo` |

**Validar de verdade:** rode uma pipeline. Se ela sai da fila e fica verde, o free tier assumiu.

> 🔑 **A cobrança é pró-rata diária.** A própria tela avisa: *"This organization is enabled for user assignment based billing and **daily pro-rated charges**, instead of monthly committed purchases."* Zerar **para de cobrar no mesmo dia** — não precisa esperar o ciclo fechar, e não devolve o que já passou.

### 2. Static Web App: Standard → Free

**Antes**, verifique se o Standard está sendo usado para alguma coisa. Se todas as respostas forem "vazio", o Standard não está comprando nada:

```bash
# 1. backends vinculados (só existe no Standard)
az staticwebapp backends show -n <app> -g <rg> -o json

# 2. ambientes de staging (Free tem zero)
az staticwebapp environment list -n <app> -g <rg> -o table

# 3. domínio próprio
az staticwebapp hostname list -n <app> -g <rg> -o table

# 4. auth customizada — procure a chave "auth" no staticwebapp.config.json do repo
#    (Free só aceita os provedores pré-configurados)
```

**Desligar:**

```bash
az staticwebapp update -n <app> -g <rg> --sku Free
```

**Validar** — duas checagens, e a segunda é a que importa:

```bash
# o SKU mudou?
az staticwebapp list --query "[].{nome:name, sku:sku.name}" -o table

# o site continua no ar?
curl -s -o /dev/null -w "HTTP %{http_code}\n" https://<host>/
```

> 💡 **É reversível:** `--sku Standard` volta atrás a qualquer momento. O que **não** volta sozinho são os ambientes de staging — se existirem, eles somem no rebaixamento.

### 3. Recursos do lab no Azure — a bomba nuclear

O jeito confiável de zerar um lab é **apagar o grupo de recursos inteiro**. Recurso órfão é o que sobra quando você apaga item por item.

```powershell
# lista o que seria apagado, sem apagar
.\scripts\destruir-lab-azure.ps1

# apaga de verdade
.\scripts\destruir-lab-azure.ps1 -Confirmar
```

**Validar:**

```bash
# tem que devolver ResourceGroupNotFound
az group show -n AzureAcademy

# e a varredura geral: a assinatura tem que voltar vazia (ou só com o que não é do curso)
az resource list --query "[].{nome:name, tipo:type, rg:resourceGroup}" -o table
```

> ⚠️ **Rode a varredura em TODAS as assinaturas.** Este ambiente tem duas, e é fácil apagar na errada e achar que acabou. `az account list -o table` mostra quais existem.

### 4. Test Plans — cancelar o trial

Não há CLI. `Organization settings → Billing → Basic + Test Plans`. **Marque no calendário 30 dias antes**: passado o prazo, cobra sem avisar.

### 5. PATs — não é custo, é risco

Um PAT vazado não gera fatura, mas gera incidente. Vale o mesmo ritual.

```
https://dev.azure.com/<org>/_usersSettings/tokens
  → selecionar o token → Revoke → confirmar
```

**Validar:** a tela tem que dizer `You do not have any personal access tokens yet.`

> 🐞 **A caixa de seleção múltipla não agrupa.** Marcar 4 tokens e clicar em *Revoke* abre um diálogo que confirma **um só**. É um por vez, quatro vezes. Descoberto na marra.

> 💡 **Revogar os do Git Credential Manager é barato:** ele recria o dele sozinho no próximo `git push`, pedindo login uma vez. Não hesite por causa disso.

---

## 🔍 Como auditar a conta inteira

O script [`scripts/auditar-custos.ps1`](scripts/auditar-custos.ps1) faz a varredura e imprime um relatório: recursos por assinatura, SKUs de risco (App Service Plan pago, SWA Standard, IA provisionada, Spark pool sem auto-pause), discos órfãos, VMs paradas e o custo do mês por serviço.

```powershell
.\scripts\auditar-custos.ps1                     # todas as assinaturas
.\scripts\auditar-custos.ps1 -SubscriptionId <id>
.\scripts\auditar-custos.ps1 -SemCusto           # pula a API de custo (lenta e limitada)
```

Ele **só lê** — nunca altera nada. Cada achado sai classificado em 🔴 preço fixo, 🟡 pegadinha de consumo ou 🟢 sem custo ocioso, com o comando de correção junto.

Saída real desta conta **depois** do desligamento de 31/08/2026:

```
-- Static Web Apps
   [VERDE   ] front-assistente-contasreceber [ContasReceber]
              SKU Free - gratuito
   [VERDE   ] front-dashboard-analise-90-dias [ContasReceber]
              SKU Free - gratuito

-- Azure AI / OpenAI
   [VERDE   ] wall-moj0h67m-eastus2/gpt-4o
              SKU Standard - por token, ocioso custa R$ 0

-- Synapse Spark pools
   [VERDE   ] synapseconstasreceber/spcontareceber
              auto-pause ligado (15 min) - ocioso custa R$ 0

-- Logic Apps
   [AMARELO ] pipe-contasreceber [ContasReceber]
              Consumption - cobra por acao E por verificacao de gatilho

==============================  RESUMO  ==============================
  Nenhum recurso de preco fixo encontrado.
```

> ⚠️ **O que ele não vê, e diz isso no rodapé:** os **jobs paralelos do Azure DevOps não são recurso do Azure** — não aparecem em `az resource list` nem somem com `az group delete`. Só existem na tela da organização. Mesma coisa para a licença do Test Plans. O script termina lembrando disso justamente porque foi essa a cobrança que passou despercebida por mais tempo.

### 🐞 Duas armadilhas de PowerShell que este script encontrou

Valem para **qualquer** script que embrulhe a Azure CLI no Windows:

**1. `$ErrorActionPreference = 'Stop'` + stderr do `az` = tudo vira `null`.** No PowerShell 5.1, qualquer coisa que um executável nativo escreva em stderr — até um `WARNING` inofensivo — vira um `NativeCommandError`. Com `Stop`, isso é **terminante**, o `catch` engole, e a função devolve `$null`.

O sintoma é traiçoeiro: **uma assinatura cheia de recursos foi reportada como vazia, sem um único erro na tela.** A correção é rebaixar o `ErrorActionPreference` dentro do wrapper e restaurar no `finally`:

```powershell
function Invocar-Az([string]$Comando) {
    $preferenciaAnterior = $ErrorActionPreference
    $ErrorActionPreference = 'SilentlyContinue'
    try {
        $saida = Invoke-Expression "$Comando 2>`$null"
        if ($LASTEXITCODE -ne 0) { return $null }
        return (ConvertFrom-Json (($saida | Out-String).Trim()))
    } catch { return $null }
    finally {
        $ErrorActionPreference = $preferenciaAnterior
        $global:LASTEXITCODE = 0   # az deixa sujo; sem isso o script sai != 0
    }
}
```

**2. `az disk list` exige `-g` nesta versão da CLI.** Diferente de `az vm list`, que aceita escopo de assinatura. A saída é listar os discos por `az resource list --resource-type Microsoft.Compute/disks` e consultar cada um com `az disk show`.

> 🔑 **A lição maior:** um script de auditoria que falha em silêncio é **pior que nenhum**, porque produz confiança falsa. A primeira execução deste aqui disse "nada custando" para uma assinatura com 14 recursos. Todo wrapper de CLI precisa distinguir *"consultei e não achei"* de *"a consulta falhou"* — foi para isso que entrou o teste de `$LASTEXITCODE`.

### Fazendo a consulta de custo na mão

A fonte autoritativa é a **Cost Management Query API**:

```bash
cat > body.json <<'JSON'
{"type":"ActualCost","timeframe":"MonthToDate",
 "dataset":{"granularity":"None",
   "aggregation":{"total":{"name":"Cost","function":"Sum"}},
   "grouping":[{"type":"Dimension","name":"ServiceName"}]}}
JSON

az rest --method post \
  --url "https://management.azure.com/subscriptions/<sub>/providers/Microsoft.CostManagement/query?api-version=2023-11-01" \
  --body @body.json --headers "Content-Type=application/json"
```

Troque `ServiceName` por `ResourceId` para descer ao recurso, ou `granularity` para `Daily` para ver o efeito de um desligamento dia a dia.

Resultado real desta assinatura em 31/08/2026 (mês a mês corrente, **antes** do desligamento aparecer):

```
   18,23  Azure DevOps        ← jobs paralelos pagos
    6,71  Azure App Service   ← as 2 Static Web Apps Standard
    1,47  Logic Apps          ← polling do pipe-contasreceber
    0,00  Storage
   26,41  TOTAL (BRL)
```

> 🐞 **Essa API é agressivamente limitada.** Ela devolve `429 Too Many Requests` com muito pouca chamada — na prática, **cerca de uma consulta por minuto**. Não faça loop; faça uma consulta boa. Foi por isso que o script tem a flag `-SemCusto`.

> 🐞 **`az consumption usage list` parece a alternativa e não é.** Nesta assinatura ela lista os recursos mas devolve `pretaxCost: "None"` em todas as linhas — a API legada não popula custo para assinaturas modernas. Use Cost Management.

### O alerta que evita tudo isso

Auditar é reativo. O que resolve de verdade é um **orçamento com alerta**:

```bash
# não havia nenhum nesta conta
az consumption budget list -o table
```

`Cost Management → Orçamentos → Adicionar` · valor mensal (ex.: R$ 30) · alertas em 50/80/100 % · e-mail. **Orçamento no Azure não bloqueia gasto** — ele avisa. Para bloquear seria preciso uma Action Group com automação.

---

## 📋 Checklist de desligamento

Ao terminar uma sessão de estudo, de cima para baixo:

| # | Ação | Comando de validação | Esperado |
|---|---|---|---|
| 1 | Apagar o grupo de recursos | `az group show -n AzureAcademy` | `ResourceGroupNotFound` |
| 2 | Repetir na outra assinatura | `az resource list -o table` | vazio |
| 3 | Zerar jobs pagos (se o free tier existir) | tela de parallel jobs | `Monthly purchases: 0` |
| 4 | Cancelar trial do Test Plans | tela de Billing | sem cobrança listada |
| 5 | Revogar PATs de sessão | tela de tokens | `You do not have any…` |
| 6 | Conferir SKUs que sobraram | `.\scripts\auditar-custos.ps1` | nada em 🔴 |
| 7 | Confirmar no dia seguinte | Cost Management, granularidade **Daily** | linha do serviço vai a R$ 0 |

> 🔑 **O passo 7 é o único que prova.** Os anteriores mostram que a **configuração** mudou; só o custo diário mostra que a **cobrança** parou. Como é pró-rata diária, o resultado aparece no dia seguinte.

---

## 🐞 Troubleshooting Comum

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Pipeline em `No hosted parallelism has been purchased or granted` | Zerou o job pago sem ter o grant gratuito | Comprar 1 job de novo **ou** pedir o [grant](https://aka.ms/azpipelines-parallelism-request) (2–3 dias úteis) |
| Custo não caiu no dia seguinte | Olhou *Amortized* em vez de *Actual*, ou o Save não aplicou | Reconferir `Monthly purchases: 0` na tela de parallel jobs |
| `429 Too Many Requests` no Cost Management | Limite agressivo da API | Esperar ~1 min; usar `-SemCusto` no script |
| `pretaxCost: None` no `az consumption` | API legada não popula custo aqui | Usar a Cost Management Query API |
| Apagou o RG e ainda cobra | Recurso em **outro** RG, outra assinatura, ou cobrança que não é recurso (Azure DevOps) | `az resource list` em cada assinatura |
| VM parada e ainda cobra | Disco gerenciado sobrevive à desalocação | Apagar o RG, ou o disco explicitamente |
| Static Web App quebrou após ir para Free | Usava linked backend, staging ou auth custom | `--sku Standard` volta atrás |
| Cobrança surpresa depois de 30 dias | Trial do Test Plans não cancelado | `Organization settings → Billing` |
| O assistente não consegue digitar na tela de billing | Trilho de segurança do MCP + classificador | **É proposital.** Essa tela é sua — ver [00-guia-navegacao-mcp](00-guia-navegacao-mcp.md) |

---

## 🧠 Conceitos Aprendidos

| Conceito | Em uma frase |
|---|---|
| **Preço fixo vs. por uso** | Preço fixo cobra por existir; por uso cobra por acontecer — e é o fixo que sangra em lab parado |
| **Cobrança pró-rata diária** | Zerar hoje para de cobrar hoje; não devolve o passado nem espera o ciclo |
| **Quota ≠ cobrança** | São dois sistemas independentes, e cada um tem seu próprio "limite" |
| **Contadores de quota são por serviço** | App Service esgotado não diz nada sobre VM |
| **Free tier substituído por compra** | Comprar para destravar cria uma cobrança que sobrevive à chegada do benefício gratuito |
| **Tier alto sem uso** | Standard sem linked backend, staging, domínio ou auth é pagar por seis coisas e usar zero |
| **Auto-pause** | Transforma um recurso de preço fixo em preço por uso — é a diferença entre R$ 0 e centenas |
| **Desalocado ≠ apagado** | Compute para, disco continua |
| **Validar o desligamento** | Configuração mudada não é cobrança parada; só o custo do dia seguinte prova |

---

## ✅ Quiz Mental

<details>
<summary>Você tem um Spark pool de 10 nós e duas Static Web Apps. Qual dos dois provavelmente custa mais parado?</summary>

**As Static Web Apps.** Se o Spark pool tem auto-pause, ele custa **R$ 0** ocioso — cobra vCore-hora só enquanto uma sessão roda. Duas SWAs Standard custam ≈ US$ 18/mês (≈ R$ 94) **sem ninguém acessar**.

Foi exatamente o caso deste ambiente. O instinto de olhar para o recurso que *parece* grande é o erro.
</details>

<details>
<summary>A tela de Billing mostra "Paid parallel jobs = 1". Você zera. O que pode dar errado?</summary>

**As pipelines param**, se a organização não tiver o free tier concedido. Organizações novas ficam sem o job gratuito por medida antifraude da Microsoft.

Por isso a ordem é: **primeiro** confirmar `Free tier — 1 parallel job up to 1800 mins/mo` na tela de parallel jobs, **depois** zerar. Se a linha não estiver lá, peça o grant em `aka.ms/azpipelines-parallelism-request` e espere 2–3 dias úteis.
</details>

<details>
<summary>Você apagou o grupo de recursos e o custo do mês continua subindo. O que investigar?</summary>

Três coisas, nesta ordem:

1. **Outra assinatura.** `az account list -o table` — é comum ter mais de uma e apagar na errada.
2. **Recurso fora do RG.** `az resource list` sem filtro, na assinatura toda.
3. **Cobrança que não é de recurso Azure.** Jobs paralelos do Azure DevOps aparecem no Cost Management como serviço `Azure DevOps`, mas **não são um recurso** e não somem com `az group delete`. Foi o caso aqui.
</details>

<details>
<summary>Por que "quota zerada" não significa "sem crédito"?</summary>

São sistemas independentes. Quota é **capacidade** — quantas VMs aquela região aceita criar para você, controlada por disponibilidade e antifraude. Cobrança é **pagamento**.

A prova neste ambiente: `spendingLimit: Off` (sem limite de gasto, pagamento ativo) e ainda assim `Current Limit (Total VMs): 0` no App Service. Pagar mais não resolve; o caminho é pedir aumento de cota ou trocar de região.
</details>

<details>
<summary>Sua VM está desalocada. Quanto ela custa?</summary>

**O disco.** `deallocate` libera o compute e para essa cobrança, mas o disco gerenciado continua existindo e cobrando (≈ US$ 2–5/mês num 32 GB). IP público estático reservado também segue cobrando.

"Parada" economiza a maior parte, mas não é zero. Zero é apagar o grupo de recursos.
</details>

---

## 🗺️ Status do Roadmap

| Item | Estado |
|---|---|
| Grupos `AzureAcademy` apagados nas 2 assinaturas | ✅ 30/08/2026 |
| Jobs paralelos pagos zerados (MS-hosted + self-hosted) | ✅ 31/08/2026 |
| Static Web Apps Standard → Free | ✅ 31/08/2026 |
| PATs revogados | ✅ 31/08/2026 |
| Script de auditoria | ✅ [`scripts/auditar-custos.ps1`](scripts/auditar-custos.ps1) |
| **Orçamento com alerta** | 🔜 **não existe nenhum** — é o item que falta |
| Validação do custo diário pós-desligamento | 🔜 conferir a partir de 01/09/2026 |

---

## 📚 Leitura complementar

| Livro | Onde | Por quê |
|---|---|---|
| **#01** *Fundamentals of Azure* | cap. 1 — Getting started · cap. 8 — Management tools | Assinaturas, grupos de recursos e as ferramentas de gestão |
| **#02** *Azure for Architects* | cap. 2 — Azure Design Patterns | Escolher tier é decisão de arquitetura, não de planilha |
| **#07** *Practical Microsoft Azure IaaS* | cap. 5–6 — Scalability | Quando capacidade reservada compensa e quando não |

> Acervo completo e critério de uso em **[bibliografia.md](bibliografia.md)**.

---

## 🔗 Conexões

| Tema | Onde |
|---|---|
| **Montar e destruir o ambiente** | **[ambiente-lab-azure.md](ambiente-lab-azure.md)** · [`scripts/`](scripts/) |
| Levantamento de custo deste ambiente | [README — 💰 Custos](README.md) |
| Onde a quota apareceu primeiro | [lab-03](lab-03-repos-azure-devops-github-codespaces.md) |
| Plano B1 com 3 web apps em vez de slots | [lab-06](lab-06-release-cd-slots-e-logic-apps.md) |
| Custo de VM e deployment group | [lab-07](lab-07-deployment-groups-vms.md) |
| Licença do Test Plans | [lab-08](lab-08-testes-manuais-e-automatizados.md) |
| Ativação do agent pool e do billing | [02-ativar-agent-pool.md](02-ativar-agent-pool.md) |
| Por que o assistente não digita em tela de billing | [00-guia-navegacao-mcp.md](00-guia-navegacao-mcp.md) |

---

## 💡 Reflexão Final

O curso ensina a **construir** esteira. Não ensina a **desligar** — e desligar é metade do trabalho de quem estuda em nuvem com dinheiro próprio.

O que este desligamento revelou não foi um erro de configuração, foi um **erro de atenção**: o item mais caro da conta (≈ R$ 210/mês) era uma compra feita semanas antes para destravar um lab, que continuou cobrando depois que a Microsoft concedeu o mesmo recurso de graça. Ninguém desfaz uma compra que resolveu um problema — o problema sumiu, a compra ficou.

Daí a única prática que realmente protege: **toda compra feita para destravar algo nasce com data de revisão.** Se você comprou um job paralelo porque o grant não tinha saído, ponha no calendário para checar quando ele sair. Não é disciplina financeira, é higiene de infraestrutura — a mesma razão pela qual você põe TTL em cache e expiração em token.

E fica a lição menor, mas que se aplica todo dia: **a etapa de validação não é opcional.** Zerar o campo e ver o formulário aceitar não prova nada; ler `Monthly purchases: 0` na tela do servidor prova a configuração; ver a linha do serviço cair a R$ 0 no custo diário prova a cobrança. São três níveis de evidência diferentes, e só o terceiro é dinheiro.
