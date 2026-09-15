# 🧪 Laboratório Prático: Ativando o Agent Pool (billing + jobs paralelos)

> **Tema:** Ligar o motor dos **Azure Pipelines** — vincular a assinatura no *billing* e liberar os **jobs paralelos** do pool interno
> **Pré-requisitos:** [01 — Organização criada](01-criar-organizacao-azure-devops.md) · **assinatura do Azure ativa com método de pagamento**
> **Conceitos base:** [Devops/Jenkins](../../Jenkins/README.md) (o mesmo papel de "agente", self-hosted), [Devops/Docker](../../Docker/) (o agente hospedado é um contêiner/VM efêmero)
> **Curso:** Azure Academy — *Azure DevOps & GitHub* · Guia `Ativar_Organizacao_e_Agent_Pool.pdf` (não versionado), **Parte 2**

---

## 🎯 Objetivo do Lab

Uma organização recém-criada vem com o pool **"Azure Pipelines"** já lá — **porém com 0 jobs paralelos**. Na prática: *qualquer pipeline que você criar vai ficar preso na fila para sempre.*

Este lab conserta isso em 5 passos: configurar o *billing* e confirmar os jobs paralelos.

> ⚠️ **É o lab que mais trava gente**, por dois motivos independentes: exige uma **assinatura do Azure com pagamento válido**, e mesmo depois disso a Microsoft pode **continuar mostrando 0 jobs grátis** — por uma medida antifraude. As duas situações estão cobertas aqui.

---

## 📖 O vocabulário, antes dos cliques

O guia manda "ativar o agent pool" pressupondo três conceitos. Sem eles, os passos viram decoreba:

| Termo | O que é |
|-------|---------|
| **Agent** (agente) | O software que **efetivamente roda** seu build/deploy: faz o checkout, compila, testa, publica. Um pipeline sem agente é uma receita sem cozinheiro |
| **Agent pool** | Um **grupo de agentes**, compartilhado pela organização. O pipeline pede "um agente deste pool" e o pool entrega o primeiro livre |
| **Parallel job** (job paralelo) | Quantos jobs a organização pode rodar **ao mesmo tempo**. É a unidade de licença — e **é isto que vem zerado** |

> 🔑 **A distinção que resolve a confusão:** o pool **existe** desde o primeiro minuto; o que falta é **permissão de concorrência**. Ter 0 jobs paralelos não é "não tenho agente" — é "tenho o pool, mas não posso executar nada nele".

### Os dois pools que já vêm criados

| Pool | Tipo | O que é |
|------|------|---------|
| **Azure Pipelines** | Microsoft-hosted | Gerenciado pela Microsoft. Cada execução recebe uma **VM limpa e descartável** (`windows-latest`, `ubuntu-latest`, `macos-latest`) |
| **Default** | Self-hosted | Vazio. É onde entram **as suas máquinas**, depois de instalar o agente nelas |

### Microsoft-hosted × Self-hosted

| Critério | Microsoft-hosted | Self-hosted |
|----------|------------------|-------------|
| **Manutenção** | Zero — imagem atualizada pela Microsoft | Sua: SO, patches, ferramentas |
| **Ambiente** | **Limpo a cada execução** — sem resíduo entre builds | Persistente — e por isso pode acumular sujeira |
| **Cache** | Refeito toda vez (builds mais lentos) | Cache de dependências persiste → **builds bem mais rápidos** |
| **Rede privada** | Não alcança sua VPN/on-premises | **Alcança** — é a razão nº 1 para usá-lo |
| **Hardware** | Fixo, modesto | O que você quiser (GPU, muita RAM, ARM…) |
| **Custo extra** | ~US$ 40/mês por job adicional | ~US$ 15/mês por job adicional + o custo da sua máquina |
| **Tempo de fila** | Pode haver espera em horário de pico | Você controla |

> 🔗 **Paralelo direto com o [Jenkins](../../Jenkins/README.md):** o *agent* do Azure Pipelines é o mesmo conceito do **node/agent** do Jenkins. A diferença é que no Jenkins **todo agente é self-hosted por definição** — você mantém a máquina, o Java, os plugins. O Azure Pipelines oferece a opção gerenciada, e cobra por concorrência em vez de por servidor. É o mesmo trade-off "gerenciado × controle" que aparece em toda decisão de nuvem ([Devops/Cloud](../README.md)).

---

## 🔧 Etapa 1 — Abrir as configurações da organização

No **canto inferior esquerdo** do Azure DevOps, clique em **"Organization settings"**.

```text
ONDE  Organization settings
```

> 💡 Repare que é *Organization settings*, não *Project settings*. Agent pools e cobrança são da **organização** — compartilhados por todos os projetos. É a mesma fronteira definida no lab [01](01-criar-organizacao-azure-devops.md).

---

## 🔧 Etapa 2 — Ver o pool interno

Vá em **Pipelines > Agent pools**. O pool **"Azure Pipelines"** está lá — **porém com 0 jobs paralelos**.

```text
ONDE  Pipelines > Agent pools > Azure Pipelines
```

Confirme o diagnóstico antes de agir: o pool aparece na lista, mas em *Organization settings > Pipelines > **Parallel jobs*** a contagem de Microsoft-hosted está em **0**.

---

## 🔧 Etapa 3 — Ir em Billing

No menu de configurações, abra **"Billing"** e clique em **"Set up billing"**.

```text
ONDE  Organization settings > Billing > Set up billing
```

> ❓ **"Mas eu só quero o tier gratuito. Por que preciso configurar cobrança?"**
> Porque o Azure DevOps exige uma **conta de cobrança vinculada** para liberar recursos além do mínimo — mesmo quando o consumo fica dentro do gratuito. É o modelo de "cartão no cadastro": a assinatura existe para que **haja para onde cobrar caso você passe do limite**. Enquanto ficar no tier gratuito, **o valor é zero**.

---

## 🔧 Etapa 4 — Vincular uma assinatura do Azure

Selecione a sua assinatura do Azure — **é ela que passa a ser a conta de cobrança**.

```text
ONDE  Set up billing > Azure subscription > Save
```

| Detalhe | Por quê |
|---------|---------|
| A assinatura precisa de **método de pagamento válido** | Uma assinatura de trial expirada ou sem cartão **não aparece** na lista |
| Você precisa ser **Owner** ou **Contributor** na assinatura | Sem permissão de cobrança, o Save falha |
| A assinatura pode ser **compartilhada** com outros recursos | Vincular ao Azure DevOps não a reserva nem a bloqueia |

---

## 🔧 Etapa 5 — Ajustar os jobs paralelos

Em **Pipelines > Parallel jobs**, confirme o tier gratuito ou defina os jobs **Microsoft-hosted** / **self-hosted**.

```text
ONDE  Organization settings > Pipelines > Parallel jobs
```

### O que o tier gratuito dá

| Tipo de projeto | Microsoft-hosted | Self-hosted |
|-----------------|------------------|-------------|
| **Privado** | **1** job paralelo, **1.800 min/mês** | **1** job paralelo, minutos **ilimitados** |
| **Público** (open source) | **10** jobs paralelos, minutos **ilimitados** | **10** jobs paralelos, ilimitados |

> 🔑 **Detalhe que passa batido:** o gratuito **self-hosted** tem **minutos ilimitados**. Se você já tem uma máquina ou VM sobrando, instalar o agente nela é a saída mais barata para o limite de 1.800 minutos — e ainda ganha cache persistente e acesso à rede privada.

---

## ⚠️ E se continuar mostrando 0 jobs grátis?

Esta é a parte que o guia destaca com bom motivo — **acontece na maioria das organizações novas**.

> Em organizações novas, o tier gratuito de 1 job paralelo (Microsoft-hosted) **pode precisar de uma solicitação** — é uma **medida antifraude da Microsoft**.

O sintoma no pipeline é uma mensagem explícita:

```text
##[error]No hosted parallelism has been purchased or granted.
To request a free parallelism grant, please fill out the following form:
https://aka.ms/azpipelines-parallelism-request
```

### As duas saídas

| Opção | Custo | Prazo | Quando escolher |
|-------|-------|-------|-----------------|
| **Formulário de paralelismo** ([aka.ms/azpipelines-parallelism-request](https://aka.ms/azpipelines-parallelism-request)) | Grátis | **~2 a 3 dias úteis** | Padrão. **Preencha assim que criar a organização**, sem esperar travar |
| **Comprar 1 job Microsoft-hosted** | **~US$ 40/mês** | Imediato | Se houver prazo de curso/entrega apertado |
| **Usar um agente self-hosted** | Grátis (sua máquina) | Imediato | Melhor terceira via: ilimitado em minutos, cache persistente. Ver [Jenkins](../../Jenkins/README.md) — a mecânica é a mesma |

> 💡 **Ação recomendada:** preencha o formulário **hoje**, e enquanto a liberação não chega, siga o curso com um **agente self-hosted**. Assim nada fica bloqueado e você aprende os dois modelos.

> 📌 **Boa prática do guia:** com o billing configurado e o job liberado, o pool interno passa a executar — **rode um pipeline para confirmar o verde**. Um pool "configurado" que nunca executou não é prova de nada.

---

## ✅ Parte 2 concluída

| Item | Como confirmar |
|------|----------------|
| ✅ **Organização criada** | `dev.azure.com/SUA-ORG` no ar ([lab 01](01-criar-organizacao-azure-devops.md)) |
| ✅ **Billing configurado** | *Organization settings > Billing* mostra a assinatura vinculada |
| ✅ **Pool interno ligado** | *Pipelines > Parallel jobs* mostra **≥ 1** Microsoft-hosted |
| ✅ **Pipeline executa** | Um build de verdade terminou **verde** |

### Checklist

- [ ] Assinatura do Azure vinculada em *Billing*
- [ ] *Parallel jobs* mostra pelo menos 1 job Microsoft-hosted **ou** self-hosted
- [ ] Formulário de paralelismo preenchido (se a contagem ainda estava 0)
- [ ] Um pipeline simples rodou e ficou **verde** — a única prova que conta
- [ ] Sei dizer quanto do tier gratuito estou consumindo (*Parallel jobs* mostra os minutos do mês)

---

## 🐞 Troubleshooting Comum

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| `No hosted parallelism has been purchased or granted` | Medida antifraude em organização nova | Formulário [aka.ms/azpipelines-parallelism-request](https://aka.ms/azpipelines-parallelism-request) (~2–3 dias úteis), comprar 1 job, ou usar self-hosted |
| Assinatura não aparece na lista do *Set up billing* | Trial expirado, sem método de pagamento, ou você não é Owner/Contributor | Verifique em *Subscriptions* no `portal.azure.com`; peça a permissão ao dono |
| `Save` do billing falha sem mensagem clara | Falta permissão na **assinatura** (não no Azure DevOps) | Precisa de **Owner** ou **Contributor** na assinatura |
| Pipeline preso em **queued** para sempre | 0 jobs paralelos, ou nenhum agente online no pool | *Parallel jobs* para checar a concorrência; *Agent pools > Agents* para ver se há agente **Online** |
| Rodou alguns builds e parou de rodar no fim do mês | Estourou os **1.800 min/mês** do gratuito Microsoft-hosted | Espere o ciclo virar, compre concorrência, ou migre para self-hosted (**minutos ilimitados**) |
| Agente self-hosted aparece **Offline** | Serviço do agente parado, ou a máquina não alcança `dev.azure.com` | Reinicie o serviço; libere saída HTTPS 443 para `dev.azure.com` |
| Build passa no Jenkins e falha no hosted | O agente hospedado é **limpo a cada execução** — não tem suas ferramentas instaladas | Instale o que precisa **dentro do pipeline**, ou use self-hosted |

---

## 🧠 Conceitos Aprendidos

| Conceito | Resumo |
|----------|--------|
| **Agent** | Quem executa o job de verdade |
| **Agent pool** | Grupo de agentes compartilhado pela organização |
| **Parallel job** | Unidade de **concorrência** e de licença — o que vem zerado |
| **Pool existe ≠ pool executa** | O pool "Azure Pipelines" já está lá; falta permissão de concorrência |
| **Microsoft-hosted** | VM limpa e descartável por execução; sem manutenção; sem rede privada; sem cache |
| **Self-hosted** | Sua máquina; cache persistente; **minutos ilimitados**; alcança rede privada; manutenção sua |
| **Billing vinculado** | Exigido mesmo no gratuito — é para onde cobrar **se** você passar do limite |
| **Grant antifraude** | Organizações novas podem precisar solicitar o gratuito (~2–3 dias úteis) |
| **1.800 min/mês** | Teto do gratuito Microsoft-hosted em projeto privado |

---

## ✅ Quiz Mental

**1. O pool "Azure Pipelines" aparece na lista. Então já dá para rodar pipeline?**

<details>
<summary>Ver resposta</summary>

**Não.** O pool **existir** e o pool **poder executar** são coisas diferentes. O que autoriza execução é o número de **jobs paralelos**, e em organização nova ele vem **0** — o pipeline entra na fila e nunca sai. Ver o pool na lista é justamente a pegadinha do lab: parece pronto, e não está.

</details>

**2. Você só quer o tier gratuito. Por que precisa vincular uma assinatura no billing?**

<details>
<summary>Ver resposta</summary>

Porque o Azure DevOps exige uma **conta de cobrança vinculada** para liberar recursos além do mínimo, mesmo quando o consumo fica no gratuito. A assinatura é o destino da cobrança **caso** você ultrapasse o limite — enquanto ficar dentro, o valor é **zero**. É o modelo "cartão no cadastro", não "cobrança imediata".

</details>

**3. Seu build precisa acessar um banco de dados que só existe na rede interna da empresa. Microsoft-hosted ou self-hosted?**

<details>
<summary>Ver resposta</summary>

**Self-hosted**, e não é questão de preferência. O agente Microsoft-hosted roda numa VM efêmera na infraestrutura da Microsoft: ela **não tem rota** para a sua rede privada. Só um agente rodando **dentro** da sua rede alcança esse banco. Este é o motivo nº 1 para self-hosted no mundo corporativo — e vem de brinde com cache persistente e minutos ilimitados.

</details>

**4. `No hosted parallelism has been purchased or granted`, mesmo com o billing já configurado. O que aconteceu?**

<details>
<summary>Ver resposta</summary>

Caiu na **medida antifraude** da Microsoft para organizações novas: o grant gratuito de 1 job Microsoft-hosted **não é automático**, precisa ser solicitado no formulário [aka.ms/azpipelines-parallelism-request](https://aka.ms/azpipelines-parallelism-request) (**~2–3 dias úteis**). Billing configurado **não** implica paralelismo concedido — são dois passos separados. Enquanto espera: comprar 1 job (~US$ 40/mês) ou subir um agente **self-hosted**, que não depende de grant nenhum.

</details>

---

## 🗺️ Status do Roadmap

| # | Atividade | Status |
|---|-----------|--------|
| 01 | [Criar a organização](01-criar-organizacao-azure-devops.md) | ✅ documentado |
| **02** | **Ativar o Agent Pool** | 📋 **este lab** |
| 03 | Primeiro pipeline YAML (a mapear no portal do aluno) | 🔜 |
| 04 | Agente self-hosted na prática | 🔜 (candidato natural, dado o limite de 1.800 min) |

---

## 🔗 Conexões

| Tema | Onde |
|------|------|
| Índice da formação | [README.md](README.md) |
| Criar a organização (pré-requisito) | [01-criar-organizacao-azure-devops.md](01-criar-organizacao-azure-devops.md) |
| O mesmo conceito de agente, self-hosted | [Devops/Jenkins](../../Jenkins/README.md) |
| Ambiente efêmero e imagens | [Devops/Docker](../../Docker/) |
| Trade-off gerenciado × controle | [Devops/Cloud/README.md](../README.md) |
| Qualidade dentro do pipeline | [Devops/SonarQube](../../SonarQube/README.md), [Devops/TDD](../../TDD/) |

---

## 💡 Reflexão Final

O lab inteiro existe por causa de uma decisão de produto: a Microsoft entrega o pool **visível e desligado**. Isso confunde — mas é honesto quanto ao modelo de cobrança do Azure Pipelines, que **não cobra por agente nem por minuto de máquina: cobra por concorrência**. Você não compra servidores, compra o direito de rodar N coisas ao mesmo tempo.

Entender isso muda a forma de otimizar um pipeline. No [Jenkins](../../Jenkins/README.md), o gargalo costuma ser *hardware* — adicione um node e o build acelera. Aqui o gargalo é **licença de concorrência**: dez jobs desenhados para rodar em paralelo, com 1 job paralelo contratado, executam **em fila** — e o pipeline "paralelo" leva o mesmo tempo do sequencial. Paralelizar um pipeline sem olhar essa contagem é otimização que não produz efeito nenhum.
