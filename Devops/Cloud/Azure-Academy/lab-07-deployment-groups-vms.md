# 🖥️ Lab 07 — Deployment Groups: deploy em VMs com IIS

> **Tema:** implantar em máquinas próprias (VM ou on-premises) em vez de PaaS
> **Pré-requisitos:** [Lab 06 — Release](lab-06-release-cd-slots-e-logic-apps.md) · artefato `drop` do [Lab 05](lab-05-pipelines-build-classica.md)
> **Conceitos base:** deployment group · deployment group job · agente em máquina alvo · IIS Web App Manage / Deploy · quota de vCPU
> **Curso:** Azure Academy — Azure DevOps & GitHub · Módulo 7 (Deployment Groups — VMs)
> **Estado:** 📋 configurado e documentado — **não executado** (falta VM registrada)

---

## 🎯 Objetivo do Lab

Sair do PaaS. Nos módulos anteriores o deploy ia para **App Service**, onde a Azure gerencia o servidor. Aqui o alvo é uma **máquina que é sua** — VM no Azure, VM em outro provedor, ou servidor físico no seu datacenter — com **IIS** instalado.

É o cenário de quem tem aplicação legada que não migrou para PaaS. E é o único módulo da formação em que o pipeline **entra dentro** da máquina.

---

## 📐 O conceito central: deployment group job

Esta é a distinção que faz o módulo inteiro fazer sentido.

| | **Agent job** | **Deployment group job** |
|---|---|---|
| Onde roda | Num agente hospedado pela Microsoft (ou self-hosted) | **Dentro de cada máquina** do grupo |
| Quem baixa o artefato | O agente | **Cada máquina**, individualmente |
| Alvo do deploy | Remoto (App Service, etc.) | **A própria máquina** onde o job roda |
| Tasks disponíveis | Catálogo geral | Um subconjunto — inclui as tasks **IIS** |

> 🔑 **Por que as tasks IIS só aparecem em deployment group job.** `IIS Web App Manage` e `IIS Web App Deploy` manipulam o IIS **local** — criam site, criam application pool, copiam o pacote. Elas pressupõem estar rodando *na máquina que vai servir a aplicação*. Num agent job hospedado isso não faria sentido: o IIS do agente é descartado ao fim do job.

### O que é um deployment group

Uma **coleção nomeada de máquinas** onde o agente do Azure Pipelines está instalado e registrado. Cada máquina pode ter **tags** (`web`, `db`, `prod`), e o job pode filtrar por elas — é assim que se implanta só nos servidores web de um grupo que também tem os de banco.

O grupo é definido em `Pipelines → Deployment groups`, e existe no escopo do **projeto**.

---

## 🧱 As duas tasks do lab

### `IIS Web App Manage`

Prepara o terreno. Cria ou atualiza:

| Configuração | Valor típico |
|---|---|
| Configuration type | **IIS Website** |
| Action | **Create Or Update** |
| Website name | `AzureAcademyMVC` |
| Bindings | `http` · All Unassigned · porta `8080` |
| Create or update app pool | ✅ |
| Application pool name | `AzureAcademyPool` |

### `IIS Web App Deploy`

Publica o pacote. Recebe o `drop` do build (o `.zip` de Web Deploy de 9,1 MB gerado no [lab-05](lab-05-pipelines-build-classica.md)) e faz o MSDeploy contra o site que a task anterior garantiu existir.

> 💡 **A ordem importa e não é acidental.** *Manage* antes de *Deploy* porque o MSDeploy precisa de um site e um app pool já existentes. Invertendo, o primeiro deploy falha em máquina nova — e passa nas seguintes, que é o tipo de bug que só aparece quando alguém provisiona um servidor novo seis meses depois.

---

## 🔧 Como montar o stage

`Releases → editar → Add a stage → template "IIS website and SQL database deployment"`

O template já traz **os dois jobs**:

```
Stage: VMs PROD (IIS)
├─ IIS Deployment      (deployment group job)
│  ├─ IIS Web App Manage
│  └─ IIS Web App Deploy
└─ SQL Deployment      (deployment group job)
   └─ SQL DB Deploy
```

⚠️ **Remova o job `SQL Deployment`** se não houver banco no lab. Ele espera um **DACPAC** publicado pelo build, e a `AzureAcademy-CI` não produz — o `build_mvc` não tem projeto de banco de dados. Deixá-lo ali mantém campos obrigatórios vazios, e **o editor clássico não salva enquanto houver qualquer input obrigatório em branco, em qualquer stage**.

No job `IIS Deployment`, o campo que importa é **Deployment group** → selecione o seu. Quando ligado, o job passa a exibir *"Run on deployment group"* no lugar de *"Run on agent"*.

---

## 🚧 Estado neste ambiente (30/08/2026)

| Item | Estado |
|---|---|
| Deployment group `VMs PROD` (id 21) | ✅ criado |
| Máquinas registradas | 🔴 **0** |
| Stage 4 no release | 📋 configurado mas **perdido** — ver abaixo |

### O que aconteceu com o stage

Ele chegou a ser montado — template aplicado, nome `VMs PROD (IIS)`, gatilho *After stage → PRODUCAO*, deployment group vinculado. Mas **não foi salvo**: o `Save` ficava bloqueado pelo job de SQL com campos obrigatórios vazios, e sair da tela descarta.

> 🐞 **Armadilha do editor clássico, terceira vez neste curso:** alterações não salvas somem ao navegar, e o `Save` fica cinza sem dizer **qual** campo falta. A disciplina que funciona: **salvar a cada stage**, e conferir o resultado pela API — não pela tela.

### Sem máquina, o stage não roda

Um deployment group com 0 agentes deixa o release **na fila indefinidamente**, esperando um alvo que não existe. Não falha com erro claro: fica pendurado.

---

## ✅ A boa notícia: VM tem quota nesta conta

O Módulo 7 é **o primeiro que não está bloqueado**. Medido com `az vm list-usage`:

```
West Europe    Total Regional vCPUs        uso=0   limite=10
               Standard BS Family vCPUs    uso=0   limite=10
               Virtual Machines            uso=0   limite=25000
```

> 🔑 **Isto corrige uma suposição anterior.** O erro `Total VMs: 0` que barrou o App Service ([lab-03](lab-03-repos-azure-devops-github-codespaces.md)) é uma **quota de App Service farm** — contador diferente da quota de vCPU de máquina virtual. São dois sistemas separados: dá para criar VM mesmo com o App Service barrado. Ler a mensagem literal importa; o nome `Total VMs` engana.

---

## 🚀 Quando for executar de verdade

### 1. Criar a VM

```powershell
az vm create `
  -g AzureAcademy -n vm-iis-academy `
  --image Win2022Datacenter `
  --size Standard_B1s `
  --location westeurope `
  --admin-username azureuser `
  --public-ip-sku Standard
```

> `B1s` = 1 vCPU / 1 GB. Suficiente para IIS + agente num lab; apertado para qualquer coisa além disso.

### 2. Instalar o IIS

```powershell
az vm run-command invoke -g AzureAcademy -n vm-iis-academy `
  --command-id RunPowerShellScript `
  --scripts "Install-WindowsFeature -Name Web-Server -IncludeManagementTools"
```

### 3. Registrar no deployment group

`Pipelines → Deployment groups → VMs PROD → Register` gera um script PowerShell pronto, já com a URL da organização e um **PAT**. Rode-o dentro da VM (via RDP ou `az vm run-command`).

Alternativa sem RDP — a extensão de VM que faz o registro sozinha:

```powershell
az vm extension set `
  -g AzureAcademy --vm-name vm-iis-academy `
  --name TeamServicesAgent --publisher Microsoft.VisualStudio.Services `
  --settings '{"VSTSAccountName":"wallisonsousa","TeamProject":"AzureAcademy","DeploymentGroup":"VMs PROD","AgentName":"vm-iis-academy"}' `
  --protected-settings '{"PATToken":"<SEU_PAT>"}'
```

> 🔒 **O PAT vai em `--protected-settings`, nunca em `--settings`.** O primeiro é criptografado e não aparece em `az vm extension show`; o segundo é texto puro legível por qualquer pessoa com leitura no recurso.
>
> Use um PAT com escopo **mínimo** (`Deployment Groups: Read & manage`) e prazo curto. E revogue depois: `dev.azure.com/{org}/_usersSettings/tokens`.

### 4. Abrir a porta

```powershell
az vm open-port -g AzureAcademy -n vm-iis-academy --port 8080
```

### 5. Rodar o release

Com a máquina online no grupo, o stage baixa o `drop` **dentro da VM**, o *Manage* cria site e app pool, o *Deploy* publica. O entregável é `http://<ip-publico>:8080`.

---

## 💰 Custo

| Item | Aproximado |
|---|---|
| VM `Standard_B1s` Windows | ~R$ 2,70/dia |
| Disco gerenciado (Standard SSD 30 GB) | ~R$ 0,60/dia |
| IP público Standard estático | ~R$ 0,40/dia |
| **Total do módulo** | **~R$ 3,70/dia** |

Somado ao ambiente atual (~R$ 2,30/dia), dá **~R$ 6/dia**.

> 💡 **VM parada ainda cobra disco e IP.** `az vm deallocate` para a cobrança de computação mas mantém disco e IP. Para zerar mesmo, apague o grupo de recursos — ver [ambiente-lab-azure.md](ambiente-lab-azure.md).

---

## 🐞 Troubleshooting Comum

| Sintoma | Causa provável | Onde olhar |
|---|---|---|
| Release fica em fila para sempre | Deployment group sem máquina online | `Pipelines → Deployment groups` |
| Tasks IIS não aparecem no catálogo | Job é *agent job*, não *deployment group job* | Troque o tipo de job |
| `Save` cinza no editor | Campo obrigatório vazio em algum job — geralmente o SQL do template | Remova o job de SQL |
| Deploy falha com "site not found" | *Manage* não rodou antes do *Deploy* | Ordem das tasks |
| Agente registra mas fica offline | Serviço do agente parado, ou saída HTTPS bloqueada | `services.msc` na VM · firewall de saída |
| Site sobe mas responde 502/503 | App pool parado ou .NET errado no pool | IIS Manager → Application Pools |
| Não abre no navegador | Porta fechada no NSG | `az vm open-port` |
| PAT expirado | Agente perde a conexão silenciosamente | Regerar e reconfigurar |

---

## 🧠 Conceitos Aprendidos

- **Deployment group job roda dentro do alvo.** É a inversão do modelo de agente hospedado: em vez de um agente remoto empurrar, cada máquina puxa e se auto-implanta.
- **Tags são o mecanismo de segmentação.** Um grupo com servidores web e de banco usa tags para o job atingir só os certos — sem criar um grupo por papel.
- **Manage antes de Deploy.** A ordem carrega a suposição de que site e app pool existem. Inverter só falha em máquina nova, que é o pior tipo de bug: aparece meses depois, para outra pessoa.
- **Quota tem contadores independentes.** `Total VMs: 0` do App Service não é a quota de VM. Assumir que "quota zerada" é global levaria a desistir de um módulo que na verdade está liberado.
- **Segredo em extensão de VM vai em `protected-settings`.** A separação entre `settings` e `protectedSettings` existe exatamente para isso — e é fácil errar, porque as duas aceitam qualquer JSON.
- **PaaS x IaaS muda quem é responsável pelo quê.** No App Service, a Azure garante IIS, patch e runtime. Aqui é você: instalar o IIS, manter o agente vivo, abrir porta, aplicar patch. O pipeline fica mais poderoso e a operação mais cara.

---

## ✅ Quiz Mental

<details>
<summary>Por que as tasks IIS não aparecem num agent job comum?</summary>

Porque elas operam sobre o **IIS local da máquina onde o job roda**. Num agente hospedado pela Microsoft, esse IIS é de uma máquina efêmera que é destruída no fim do job — publicar ali não serviria para nada.

O deployment group job existe justamente para inverter isso: o job roda **na máquina que vai servir a aplicação**.

</details>

<details>
<summary>O deployment group existe e o stage está configurado, mas o release não sai da fila. Por quê?</summary>

Porque o grupo tem **0 máquinas registradas**. O job espera um agente que satisfaça o grupo (e as tags, se houver) — e simplesmente aguarda.

Não há erro: fica pendurado até o timeout do job. É um dos poucos casos em que o Azure Pipelines falha em silêncio, e por isso vale sempre conferir `machineCount` antes de rodar.

</details>

<details>
<summary>A quota de App Service está zerada. Faz sentido tentar criar uma VM?</summary>

**Faz — e nesta conta funciona.** São contadores diferentes: a quota de *App Service farm* e a de *vCPU de máquina virtual* são independentes.

A mensagem `Current Limit (Total VMs): 0` do App Service engana justamente por dizer "VMs". Confirme com `az vm list-usage -l <regiao>` antes de concluir que está tudo bloqueado.

</details>

<details>
<summary>Por que o PAT vai em <code>--protected-settings</code> e não em <code>--settings</code>?</summary>

Porque `settings` é armazenado e devolvido em **texto puro** por `az vm extension show` — qualquer pessoa com permissão de leitura no recurso vê o token.

`protectedSettings` é criptografado com a chave do certificado da VM e nunca é devolvido em consulta. As duas aceitam o mesmo JSON, então o erro é silencioso: funciona igual, vaza diferente.

</details>

---

## 🗺️ Status do Roadmap

| Fase | O que é | Status |
|---|---|---|
| 1 · **Deployment group** | `VMs PROD` criado | ✅ |
| 2 · **Conceitos** | Deployment group job, tasks IIS, ordem | ✅ este documento |
| 3 · **Confirmar quota de VM** | `az vm list-usage` | ✅ 10 vCPUs em West Europe |
| 4 · **Stage 4 no release** | Template IIS, sem o job de SQL | 🔜 refazer e **salvar** |
| 5 · **Criar a VM + IIS** | `B1s` Windows | 🔜 ~R$ 3,70/dia |
| 6 · **Registrar o agente** | Extensão `TeamServicesAgent` + PAT | 🔜 |
| 7 · **Rodar e ver no ar** | `http://<ip>:8080` | 🔜 entregável do módulo |

---

## 🔗 Conexões

| Tema | Onde |
|---|---|
| Recriar o ambiente | [ambiente-lab-azure.md](ambiente-lab-azure.md) · [`scripts/`](scripts/) |
| O release onde o stage entra | [lab-06](lab-06-release-cd-slots-e-logic-apps.md) |
| O artefato `drop` que é publicado | [lab-05](lab-05-pipelines-build-classica.md) |
| A app ASP.NET que roda no IIS | [projeto-build-mvc.md](projeto-build-mvc.md) |
| Onde a quota apareceu primeiro | [lab-03](lab-03-repos-azure-devops-github-codespaces.md) |
| Contêineres — o outro caminho para legado | [Devops/Docker](../../Docker/), [Devops/Kubernetes](../../Kubernetes/) |

---

## 💡 Reflexão Final

Este módulo é o contraponto de tudo o que veio antes. Os Módulos 3 a 6 vivem em PaaS, onde a plataforma some das suas preocupações. Aqui ela volta inteira: instalar IIS, manter agente vivo, abrir porta, aplicar patch.

A troca é explícita — **mais controle, mais responsabilidade**. E é por isso que o módulo importa mesmo para quem só vai trabalhar com PaaS: ele mostra o que o App Service estava fazendo por você o tempo todo.

O detalhe que vale levar é a inversão do modelo de execução. Num agent job, um agente remoto empurra o código para o alvo. Num deployment group job, **o alvo executa o pipeline sobre si mesmo**. Essa diferença explica por que o catálogo de tasks muda, por que o artefato é baixado N vezes, e por que as tags existem.
