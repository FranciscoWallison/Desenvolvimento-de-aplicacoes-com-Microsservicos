# 📚 Bibliografia — Biblioteca virtual da Azure Academy

> **O que é:** as 10 leituras complementares oferecidas em [`labs.azureacademy.com.br/pdfs`](https://labs.azureacademy.com.br/pdfs), mapeadas para os módulos do curso
> **Para que serve:** quando uma anotação deixa um "por quê" em aberto, esta tabela diz **onde ler mais**
> **Onde estão os arquivos:** `materiais/livros/` — ❌ **fora do controle de versão**

> ⚖️ **Sobre os arquivos.** A biblioteca é descrita no portal como *"leituras adicionais gratuitas"* — são e-books de distribuição livre (Microsoft Press, Apress, o Scrum Guide sob Creative Commons, guias gratuitos da Packt e do C#Corner). Ainda assim, **este repositório não os redistribui**: `materiais/` é ignorado pelo git. O que se publica aqui são **referências bibliográficas** — autor, título, capítulo — que é o que permite você achar a passagem, não substituí-la.

---

## 📖 O acervo

| # | Título | Autores | Editora / Ano |
|---|---|---|---|
| **01** | *Microsoft Azure Essentials: Fundamentals of Azure*, 2ª ed. | Michael Collier, Robin Shahan | Microsoft Press |
| **02** | *Azure for Architects* | Ritesh Modi | Packt |
| **03** | *Managing Agile Open-Source Software Projects with Microsoft Visual Studio Online* | Brian Blackman, Gordon Beaming, Michael Fourie, Willy-Peter Schaub | Microsoft Press |
| **04** | *Guia do Scrum™* (pt-BR) | Ken Schwaber, Jeff Sutherland | scrumguides.org · CC BY-SA |
| **05** | *Guia do desenvolvedor do Azure* (pt-BR) | Microsoft | Microsoft, 2019 |
| **06** | *DevOps for ASP.NET Core Developers* | Cam Soper, Scott Addie, Colin Dembovsky | Microsoft, 2021 |
| **07** | *Practical Microsoft Azure IaaS* | Shijimol Ambi Karthikeyan | Apress |
| **08** | *Microsoft Azure Essentials: Azure Automation* | Michael McKeown | Microsoft Press |
| **09** | *Implementing Azure DevOps Solutions* | Henry Been, Maik van der Gaag | Packt, 2020 · ISBN 978-1-78961-969-0 |
| **10** | *Azure DevOps: Complete CI/CD Pipeline* | Mukesh Kumar | C#Corner, 2019 |

---

## 🎯 O livro que mais importa: **#09**

*Implementing Azure DevOps Solutions* é o único do acervo escrito **especificamente para a trilha AZ-400** — a mesma que esta formação segue. A estrutura dele espelha os módulos do curso quase um a um:

| Seção | Capítulo | Módulo correspondente |
|---|---|---|
| **1 · Getting to Continuous Delivery** | 1 · Introduction to DevOps | [lab-01](lab-01-organizacoes-projetos-e-equipes.md) |
| | 2 · Everything Starts with Source Control | [lab-03](lab-03-repos-azure-devops-github-codespaces.md) |
| | 3 · Moving to Continuous Integration | [lab-05](lab-05-pipelines-build-classica.md) |
| | 4 · Continuous Deployment | [lab-06](lab-06-release-cd-slots-e-logic-apps.md) |
| **2 · Expanding your DevOps Pipeline** | 5 · Dependency Management | [projeto-build-mvc](projeto-build-mvc.md) — `packages.config` |
| | 6 · Infrastructure and Configuration as Code | [lab-04](lab-04-iac-arm-e-automacoes.md) |
| | 7 · Dealing with Databases in DevOps Scenarios | runbook `sqlescala` — [lab-06](lab-06-release-cd-slots-e-logic-apps.md) |
| | 8 · Continuous Testing | [lab-08](lab-08-testes-manuais-e-automatizados.md) |
| | 9 · Security and Compliance | — |
| **3 · Closing the Loop** | 10 · Application Monitoring | — |
| | 11 · Gathering User Feedback | — |

> 💡 **Os capítulos 9 a 11 não têm módulo correspondente no curso** — segurança/compliance, monitoramento e feedback do usuário ficaram de fora da formação. São justamente o *"Closing the Loop"*: sem eles o ciclo DevOps fica aberto, entregando sem medir. Vale ler mesmo sem aula.

---

## 🗺️ Tema → onde ler

### Fundamentos e conceitos

| Assunto | Leitura |
|---|---|
| O que é DevOps, cultura e práticas | **#09** cap. 1 |
| Panorama do Azure (portal, assinaturas, grupos de recursos) | **#01** cap. 1 |
| Scrum: papéis, eventos, artefatos | **#04** — 19 páginas, leitura de uma sentada |
| Gestão ágil dentro do Azure DevOps | **#03** |

### Por módulo do curso

| Módulo / anotação | Leitura principal | Complementar |
|---|---|---|
| **[lab-01](lab-01-organizacoes-projetos-e-equipes.md)** — organizações, projetos, equipes | **#09** cap. 1 | **#03** |
| **[lab-02](lab-02-boards-backlog-sprints-dashboards-queries.md)** — boards, backlog, sprints | **#04** (Scrum Guide) | **#03** |
| **[lab-03](lab-03-repos-azure-devops-github-codespaces.md)** — repos, branches, PRs | **#09** cap. 2 | **#06** |
| **[lab-04](lab-04-iac-arm-e-automacoes.md)** — IaC com ARM | **#09** cap. 6 | **#07** cap. 7 · **#02** cap. 2 |
| **[lab-05](lab-05-pipelines-build-classica.md)** — build / CI | **#09** cap. 3 | **#10** |
| **[lab-06](lab-06-release-cd-slots-e-logic-apps.md)** — release / CD, slots, gates | **#09** cap. 4 | **#10** · **#08** (runbooks) |
| **[lab-07](lab-07-deployment-groups-vms.md)** — deployment groups, VMs, IIS | **#01** cap. 3 · **#07** cap. 2 | **#02** cap. 3–4 |
| **[lab-08](lab-08-testes-manuais-e-automatizados.md)** — testes | **#09** cap. 8 | — |
| **[projeto-build-mvc](projeto-build-mvc.md)** — a app ASP.NET | **#01** cap. 2 (App Service) | **#09** cap. 5 (dependências) |
| **[ambiente-lab-azure](ambiente-lab-azure.md)** — provisionar e destruir | **#01** cap. 8 (Management tools) | **#05** |

### Temas que o curso não cobriu

| Assunto | Leitura | Por que importa |
|---|---|---|
| Segurança e compliance na esteira | **#09** cap. 9 | Scan de dependência, secrets, políticas — o "DevSecOps" |
| Monitoramento de aplicação | **#09** cap. 10 | Sem isso, o gate de Azure Monitor do [lab-06](lab-06-release-cd-slots-e-logic-apps.md) não tem o que consultar |
| Feedback do usuário | **#09** cap. 11 | Fecha o ciclo: entregar → medir → decidir o próximo item do backlog |
| Alta disponibilidade e escalabilidade | **#02** cap. 3–4 · **#07** cap. 5–6 | O contexto arquitetural por trás do blue/green |
| Migração de workload para IaaS | **#07** cap. 2–3 | O caminho oposto ao dos labs: sair do on-premises |
| Azure AD / Entra ID | **#01** cap. 7 | Onde vive o service principal da service connection |

---

## 🔎 Como usar esta bibliografia

**Não leia na ordem.** O acervo tem ~1.500 páginas somadas; ler tudo antes de praticar é a forma mais lenta de aprender infraestrutura.

O uso que funciona:

1. **Faça o lab** — o [ambiente-lab-azure](ambiente-lab-azure.md) monta tudo em ~10 minutos
2. **Bata numa dúvida** — "por que slots exigem Standard?", "por que quota e cobrança são separados?"
3. **Vá ao capítulo específico** desta tabela
4. **Volte e anote** o que entendeu, nas suas palavras, no lab correspondente

> 🔑 **A pergunta vem antes da leitura.** As armadilhas registradas nestas anotações — quota zerada, aspa escapada no MSBuild, artefato errado selecionado em silêncio — **nenhuma está nos livros**. Livro ensina o modelo; o lab ensina onde o modelo encontra a realidade. As duas coisas são necessárias, e nessa ordem.

### Se for ler só um

**#09, capítulos 1 a 4.** São ~120 páginas e cobrem exatamente o arco que este curso percorreu: DevOps → source control → CI → CD. Depois disso, os outros viram consulta.

### Se tiver 20 minutos

**#04, o Guia do Scrum.** Dezenove páginas, escritas pelos criadores do framework. É a fonte primária de tudo que o [lab-02](lab-02-boards-backlog-sprints-dashboards-queries.md) configura no Boards — e a maior parte do que se lê sobre Scrum na internet é interpretação de segunda mão deste documento.

---

## 🔗 Conexões

| Tema | Onde |
|---|---|
| Índice da formação | [README.md](README.md) |
| Montar o ambiente para praticar | [ambiente-lab-azure.md](ambiente-lab-azure.md) |
| Material dos módulos (PDFs do instrutor) | `materiais/` — também fora do git |
| CI/CD com Jenkins, o contraponto self-hosted | [Devops/Jenkins](../../Jenkins/README.md) |
| Contêineres e orquestração | [Devops/Docker](../../Docker/), [Devops/Kubernetes](../../Kubernetes/) |
| Qualidade e testes | [Devops/TDD](../../TDD/), [Devops/SonarQube](../../SonarQube/) |
