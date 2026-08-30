# 🧪 Laboratório Prático: Criando a Organização no Azure DevOps

> **Tema:** Criar a **organização** — o contêiner de mais alto nível do Azure DevOps, onde vivem Boards, Repos e Pipelines
> **Pré-requisitos:** conta Microsoft com acesso ao [portal.azure.com](https://portal.azure.com)
> **Conceitos base:** [Devops/Cloud/README.md](../README.md) (fundamentos de nuvem), [Devops/Gitflow](../../Gitflow/) (fluxo de branches que vai morar nos Repos)
> **Curso:** Azure Academy — *Azure DevOps & GitHub* · Guia `Ativar_Organizacao_e_Agent_Pool.pdf` (não versionado), **Parte 1**
> **Próxima atividade:** [02 — Ativar o Agent Pool](02-ativar-agent-pool.md)

---

## 🎯 Objetivo do Lab

Criar a organização que vai hospedar **todo o trabalho do curso**. Ao final, existirá um endereço `dev.azure.com/SUA-ORG` no ar, pronto para receber projetos, repositórios e pipelines.

São 5 passos e leva menos de 5 minutos. O que vale a pena é entender **o que está sendo criado** — porque duas decisões deste lab (o **nome** e a **região**) são difíceis de desfazer depois.

---

## 📖 Organização, projeto, repositório: quem contém quem

O guia do curso manda criar a organização sem explicar onde ela se encaixa. A hierarquia é esta:

```
Organização  (dev.azure.com/SUA-ORG)          ← este lab cria isto
└── Projeto  (dev.azure.com/SUA-ORG/MeuApp)
    ├── Boards      → work items, sprints, backlog
    ├── Repos       → repositórios Git
    ├── Pipelines   → CI/CD  ← o lab 02 liga o motor disto
    ├── Test Plans  → testes manuais e exploratórios
    └── Artifacts   → feeds de pacotes (npm, NuGet, Maven…)
```

| Nível | O que é | Quando criar outro |
|-------|---------|--------------------|
| **Organização** | Fronteira de **cobrança**, de **identidade** e de **região dos dados**. Tem seus próprios usuários, políticas e agent pools | Raramente — normalmente **uma por empresa** (ou uma para estudo, como aqui) |
| **Projeto** | Fronteira de **trabalho e permissão**. Cada um tem Boards, Repos e Pipelines próprios | Um por produto/time. Times pequenos costumam ficar melhor com **um projeto e vários repos** |
| **Repositório** | Um repo Git | Um por serviço/aplicação |

> 🔑 **Erro comum de quem está começando:** criar um projeto por microsserviço. Isso fragmenta backlog, dashboards e permissões. A recomendação da própria Microsoft é **poucos projetos, muitos repositórios** — o que casa com o que está em [Arquitetura-de-Software/Microsservicos](../../../Arquitetura-de-Software/Microsservicos/).

---

## 🔧 Etapa 1 — Acessar o portal do Azure

Entre em **[portal.azure.com](https://portal.azure.com)** e faça login com sua conta.

```text
ONDE  portal.azure.com
```

> 💡 Dá para ir direto em [`aex.dev.azure.com`](https://aex.dev.azure.com) e pular as etapas 1–3. O guia passa pelo portal porque é ali que, no lab [02](02-ativar-agent-pool.md), você vai precisar da **assinatura** — vale conferir agora se ela existe e está ativa.

---

## 🔧 Etapa 2 — Procurar "Azure DevOps"

Na **barra de busca no topo** do portal, digite `Azure DevOps organizations` e abra o resultado.

```text
ONDE  Busca do topo > Azure DevOps organizations
```

| Detalhe | Por quê |
|---------|---------|
| A busca é **global** | Cobre serviços, recursos e documentação — é o caminho mais rápido no portal |
| O resultado é uma **página de ponte** | O Azure DevOps não é um recurso do Azure como uma VM: ele mora fora do portal, em `dev.azure.com`. Esta tela só faz a ligação |

---

## 🔧 Etapa 3 — Clicar em "Gerenciar"

Abra **"My Azure DevOps Organizations"** (Gerenciar). Você é levado para fora do portal, para o Azure DevOps.

```text
ONDE  My Azure DevOps Organizations
```

Aqui aparecem as organizações que sua conta já acessa. Numa conta nova, a lista vem vazia.

---

## 🔧 Etapa 4 — Criar a nova organização

Clique em **"New organization"** (Criar) e siga o assistente.

```text
ONDE  New organization
```

---

## 🔧 Etapa 5 — Nome e região

Escolha um **nome único** e a **região mais próxima**. Confirme para criar.

```text
ONDE  Nome > Região > Continue
```

### As duas decisões que importam

| Campo | Regra | Consequência |
|-------|-------|--------------|
| **Nome** | **Único globalmente** — vira a URL `dev.azure.com/SUA-ORG`. Letras, números e hífen; não começa nem termina com hífen | Renomear depois **quebra todos os links, remotes de Git e URLs de pipeline** já configurados |
| **Região** | Escolhida **na criação** | Define **onde os dados ficam** (residência/LGPD) e a **latência** de cada operação. Mudar depois exige **abrir chamado com a Microsoft** — não é um botão |

> 🔑 **Escolha a região pensando em dois eixos:** *latência* (o time que vai usar) e *conformidade* (onde o dado pode legalmente repousar). Para um time no Brasil, **Brazil South** atende aos dois. Se a exigência for de dado em solo brasileiro, a escolha deixa de ser preferência e vira requisito — o mesmo raciocínio de residência de dados que aparece em [Governanca-e-Gestao/Governanca](../../../Governanca-e-Gestao/Governanca/).

> 💡 **Nome:** prefira algo estável e institucional (`empresa`, `empresa-dev`) a algo datado (`curso-2026`). Você vai conviver com esta URL.

---

## ✅ Parte 1 concluída

Sua organização vive em **`dev.azure.com/SUA-ORG`**.

> 📌 **Boa prática do guia:** guarde este endereço. É por ali que o time acessa **Boards, Repos e Pipelines** — não pelo `portal.azure.com`.

### Checklist

- [ ] Organização criada e acessível em `dev.azure.com/SUA-ORG`
- [ ] Nome anotado (ele é a URL de tudo daqui pra frente)
- [ ] Região conferida em *Organization settings > Overview*
- [ ] Consigo abrir **Boards**, **Repos** e **Pipelines** no menu lateral
- [ ] **Assinatura do Azure ativa e com método de pagamento** — pré-requisito do lab [02](02-ativar-agent-pool.md)

---

## 🐞 Troubleshooting Comum

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| "The organization name is not available" | Nome já existe **globalmente** (não só na sua conta) | Escolha outro. O espaço de nomes é compartilhado por todos os clientes |
| Não aparece "New organization" | A conta está logada num **tenant** (diretório) onde não há permissão | Troque o diretório no canto superior direito, ou use uma conta pessoal |
| Criou a organização no tenant errado | O portal estava com outro diretório selecionado | Mais simples criar de novo com o diretório certo do que mover depois |
| Região desejada não aparece | O Azure DevOps roda num **subconjunto** das regiões do Azure | Escolha a geograficamente mais próxima entre as ofertadas |
| Fica pedindo login em loop | Sessão de outro tenant no navegador | Janela anônima, ou perfil separado do navegador |

---

## 🧠 Conceitos Aprendidos

| Conceito | Resumo |
|----------|--------|
| **Organização** | Contêiner de topo: cobrança, identidade, região dos dados e agent pools |
| **Projeto** | Fronteira de trabalho e permissão dentro da organização |
| **`dev.azure.com/SUA-ORG`** | A URL real do dia a dia — o `portal.azure.com` é só a porta de entrada e a cobrança |
| **Unicidade global do nome** | O nome disputa espaço com todos os clientes da Microsoft |
| **Região = residência de dados** | Decisão de conformidade, não só de latência; efetivamente definitiva |
| **Serviços** | Boards, Repos, Pipelines, Test Plans, Artifacts |

---

## ✅ Quiz Mental

**1. Por que o nome da organização não pode ser mudado à toa depois?**

<details>
<summary>Ver resposta</summary>

Porque o nome **é a URL**: `dev.azure.com/SUA-ORG`. Trocá-lo invalida os *remotes* de Git de todo mundo, os links salvos, as URLs de pipeline, integrações de webhook e qualquer badge de build. O custo não está em renomear — está em tudo que apontava para o nome antigo.

</details>

**2. Você precisa de 5 microsserviços versionados. Cria 5 projetos ou 1 projeto com 5 repositórios?**

<details>
<summary>Ver resposta</summary>

**1 projeto com 5 repositórios.** O projeto é a fronteira de *backlog, permissão e dashboard*: cinco projetos significam cinco backlogs desconectados, cinco conjuntos de permissões para manter e nenhuma visão única do produto. O repositório é a unidade certa para separar código. A regra prática da Microsoft é **poucos projetos, muitos repos**.

</details>

**3. A organização foi criada em `East US` e a área jurídica exige dado em solo brasileiro. Resolve mudando a região nas configurações?**

<details>
<summary>Ver resposta</summary>

**Não.** A região é definida na criação e **não há botão de troca**: migrar exige abrir chamado com a Microsoft, e nem todo cenário é atendido. Na prática, com a organização ainda vazia, **recriar em Brazil South é mais rápido e seguro** do que tentar migrar. Por isso a etapa 5 merece atenção — parece um campo de formulário, mas é uma decisão de conformidade.

</details>

---

## 🗺️ Status do Roadmap

| # | Atividade | Status |
|---|-----------|--------|
| **01** | **Criar a organização** | 📋 **este lab** |
| 02 | [Ativar o Agent Pool](02-ativar-agent-pool.md) | 🔜 próximo |
| 03 | Primeiro pipeline (a mapear no portal do aluno) | 🔜 |

---

## 🔗 Conexões

| Tema | Onde |
|------|------|
| Índice da formação | [README.md](README.md) |
| Ligar o motor dos Pipelines | [02-ativar-agent-pool.md](02-ativar-agent-pool.md) |
| Fundamentos de nuvem | [Devops/Cloud/README.md](../README.md) |
| Fluxo de branches que vai morar nos Repos | [Devops/Gitflow](../../Gitflow/) |
| O contraponto self-hosted de CI/CD | [Devops/Jenkins](../../Jenkins/README.md) |

---

## 💡 Reflexão Final

Cinco cliques, e ainda assim duas decisões praticamente irreversíveis: **nome** e **região**. É um padrão que se repete em nuvem — *as telas mais simples costumam esconder as escolhas mais permanentes*. O tempo gasto pensando no nome e na região aqui é o menor investimento de todo o curso.

E há uma segunda lição no desenho do produto: o Azure DevOps **não é um recurso do Azure**. Ele vive em `dev.azure.com`, com identidade, cobrança e região próprias; o `portal.azure.com` é apenas a porta de entrada e o lugar onde a conta é paga. Confundir os dois é a origem de metade da confusão do próximo lab.
