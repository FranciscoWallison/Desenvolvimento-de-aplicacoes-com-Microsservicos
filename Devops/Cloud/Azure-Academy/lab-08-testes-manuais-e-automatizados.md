# 🧪 Lab 08 — Testes manuais e automatizados

> **Tema:** Azure Test Plans, casos de teste como work item e testes automatizados na esteira
> **Pré-requisitos:** [Lab 02 — Boards](lab-02-boards-backlog-sprints-dashboards-queries.md) · [Lab 05 — build com VsTest](lab-05-pipelines-build-classica.md)
> **Conceitos base:** test plan · test suite · test case · Test Runner · licenciamento do Azure DevOps · pirâmide de testes
> **Curso:** Azure Academy — Azure DevOps & GitHub · Módulo 8
> **Estado:** 📋 documentado — a metade **automatizada já está funcionando**; a manual depende de licença

---

## 🎯 Objetivo do Lab

O módulo tem duas metades que costumam ser confundidas:

| Metade | O que é | Onde vive | Custa? |
|---|---|---|---|
| **Testes manuais** | Alguém executa passos e marca ✅/❌ | **Azure Test Plans** | 🔴 licença separada |
| **Testes automatizados** | O pipeline roda e reporta | **Azure Pipelines** (task VsTest) | ✅ incluso |

Na aula, o professor cria um **Test Plan** `testar login` e dentro dele um **Test Case** `validar acessos de dispositivos`. Isso é a metade manual.

---

## 🔴 O bloqueio: Test Plans é licença à parte

Ao abrir `Test Plans` nesta organização, não há botão *New Test Plan*. O portal responde:

> *"Your current Azure DevOps license provides access to only **limited subset** of Azure Test Plans features."*
> *"Ask your admin to enable the **30-day trial** today or assign you a full license!"*

### O que cada licença dá

| | **Basic** (grátis até 5 usuários) | **Basic + Test Plans** |
|---|---|---|
| Criar **Test Case** como work item | ✅ | ✅ |
| Criar **Test Plan** / **Test Suite** | ❌ | ✅ |
| **Test Runner** (executar e marcar resultado) | ❌ | ✅ |
| Progress report · Runs · Exploratory sessions | ❌ | ✅ |
| Parameters · Configurations · Shared steps | ❌ | ✅ |
| **Custo** | R$ 0 | **~US$ 52/usuário/mês** |

> 💰 **É a assinatura mais cara do Azure DevOps** — bem acima do job paralelo Microsoft-hosted (~US$ 40/mês). Existe **trial de 30 dias**, ativado pelo admin da organização. Se ativar, **marque no calendário para cancelar**: passados os 30 dias, cobra.

---

## ✅ O que dá para fazer de graça

**Test Case é um work item comum** — do mesmo tipo family que Epic, Feature e User Story. Com licença Basic você cria, escreve os passos, define resultados esperados e **vincula à User Story** que ele valida.

`Boards → Work items → New Work Item → Test Case`

O que se perde sem licença é a **gestão de execução** — agrupar em suítes, atribuir testadores, rodar no Test Runner, ver gráficos de progresso. Isso é gerência de QA; o **conteúdo** do teste continua acessível.

### Anatomia de um bom test case

Reproduzindo o exemplo da aula — `Validar acessos de dispositivos`:

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Acessar `/login` em desktop (Chrome 1920×1080) | Formulário renderiza com campos usuário e senha visíveis |
| 2 | Informar credencial válida e confirmar | Redireciona para `/home` e exibe o nome do usuário |
| 3 | Repetir em mobile (390×844) | Layout responsivo, sem rolagem horizontal |
| 4 | Repetir em tablet (820×1180) | Idem, com menu em modo compacto |
| 5 | Informar senha incorreta | Mensagem genérica de erro, **sem revelar** se o usuário existe |

> 🔑 **O passo 5 é o que separa um caso de teste de um roteiro de clique.** Ele testa uma decisão de segurança — não vazar existência de conta na mensagem de erro. Caso de teste bom carrega **critério**, não só sequência.

> 💡 **Rastreabilidade fecha o ciclo da formação.** Vinculando o Test Case à User Story (link *Tested By*), o Boards passa a mostrar cobertura por história: Boards planeja → Repos versiona → CI builda → CD promove → **Test Plans valida**. É o mesmo fio dos módulos anteriores.

---

## ⚙️ A metade automatizada — já está pronta

Esta parte do módulo **já foi feita**, sem custo nenhum, no [Lab 05](lab-05-pipelines-build-classica.md).

O build `AzureAcademy-CI` roda a task **VsTest**, que executa os três testes MSTest do projeto `AzureAcademy.MVC.Tests`:

```
Build solution          ✅
VsTest - testAssemblies ✅  100% passed
Publish Artifact: drop  ✅  9.557.745 bytes
```

Os testes vivem em [`HomeControllerTest.cs`](projeto-build-mvc.md) e a task os descobre pelo padrão `**\bin\**\*test.dll`.

### O que esses testes provam — e o que não provam

| Teste | Prova | Não prova |
|---|---|---|
| `Index` / `Contact` | A action retorna `ViewResult` não nulo | Que a view existe, que a rota chega lá |
| `About` | `ViewBag.Message` recebe o texto certo | O mesmo acima |

Eles passariam intactos se você **apagasse todos os `.cshtml`**, quebrasse o `RouteConfig` ou pusesse HTML inválido no layout. São testes de **unidade pura** — instanciam o controller com `new`, sem `HttpContext`, sem servidor.

> 🔑 **Aqui está a ponte entre as duas metades.** O que o teste unitário não alcança — rota, view, layout, comportamento no navegador — é exatamente o que o **caso de teste manual** cobre. Não são alternativas: são camadas diferentes da pirâmide.

### A pirâmide, aplicada a este projeto

```
        /\       Manual / exploratório   ← "validar acessos de dispositivos"
       /  \                                 (Test Plans, licença paga)
      /----\     Integração / E2E         ← FALTANDO: subir a app e fazer GET /Home/About
     /      \                                (gratuito: task VsTest com testes de integração)
    /--------\   Unidade                  ← ✅ 3 testes MSTest, rodando na CI
   /__________\
```

O buraco visível é a **camada do meio**: nenhum teste sobe a aplicação. Preenchê-la não custa licença — só código.

---

## 🚀 Quando for executar a parte manual

1. **Ativar o trial** — `Organization settings → Billing`, ou o link *30-day trial* na tela do Test Plans. Requer ser admin da organização.
2. **Criar o plano** — `Test Plans → New Test Plan` → nome `testar login`, área e iteração do projeto.
3. **Criar a suíte** — dentro do plano, uma *Static suite* (lista manual) ou *Requirement-based* (puxa das User Stories automaticamente).
4. **Criar o caso** — `New Test Case` → `validar acessos de dispositivos` → preencher a grade de passos e resultados esperados.
5. **Executar** — `Run for web application` abre o Test Runner: marca ✅/❌ por passo, anexa print, e **cria bug já vinculado** ao caso quando reprova.
6. **Ler o Progress report** — cobertura e taxa de aprovação por suíte.
7. **🔴 Cancelar o trial antes de 30 dias.**

> 💡 **Suíte *Requirement-based* é a que fecha a rastreabilidade.** Ela é criada a partir de uma query de work items — cada User Story vira uma pasta, e os casos ficam pendurados nela. Aí o Boards mostra "esta história tem 4 testes, 3 passando".

---

## 🐞 Troubleshooting Comum

| Sintoma | Causa provável | Onde olhar |
|---|---|---|
| Não existe botão *New Test Plan* | Licença Basic sem Test Plans | Tela mostra "limited subset" |
| Trial não aparece | Você não é admin da organização | `Organization settings → Users` |
| Test Case criado mas não aparece no plano | Foi criado solto no Boards, sem estar numa suíte | Adicione pela suíte, ou use *Add existing* |
| Test Runner não abre | Bloqueio de pop-up | Libere o domínio no navegador |
| VsTest não encontra testes | Padrão de busca não casa com o `.dll` | `**\bin\**\*test.dll` — confira o nome do assembly |
| VsTest verde mas 0 testes | Projeto de teste não compilou | Verifique o log do *Build solution* |
| Cobrança inesperada depois de 30 dias | Trial não cancelado | `Organization settings → Billing` |

---

## 🧠 Conceitos Aprendidos

- **"Testes" no Azure DevOps são dois produtos.** Automatizado vive no Pipelines e é gratuito; manual vive no Test Plans e é a licença mais cara da plataforma. Confundir os dois leva a orçar errado.
- **Test Case é work item.** Isso significa que o *conteúdo* do teste é acessível de graça — o que se paga é o **container e a execução**.
- **Teste unitário verde não é aplicação funcionando.** Os três testes daqui passariam com todas as views apagadas. Saber o que um teste **não** cobre vale tanto quanto saber o que ele cobre.
- **A camada de integração é o buraco mais comum.** É barata (mesma task, mesmo pipeline) e quase sempre ausente — porque exige subir a aplicação, e ninguém quer escrever esse setup.
- **Rastreabilidade é o produto real do Test Plans.** Executar teste manual você faz numa planilha. O que a licença compra é a ligação *história → caso → execução → bug*, auditável.
- **Trial com data de validade precisa de lembrete.** ~US$ 52/usuário/mês começa a correr no dia 31 sem aviso.

---

## ✅ Quiz Mental

<details>
<summary>Dá para estudar casos de teste sem pagar a licença?</summary>

**Dá — a parte que importa.** Test Case é um work item comum: com licença Basic você cria, escreve passos e resultados esperados, e vincula à User Story.

O que a licença cobra é a **camada de gestão**: agrupar em planos e suítes, executar no Test Runner com registro por passo, e os relatórios de progresso. Escrever um bom caso de teste — que é a habilidade — não depende disso.

</details>

<details>
<summary>A CI mostra "100% passed". Posso publicar com confiança?</summary>

**Não, e o número engana.** Os três testes só verificam que as actions retornam `ViewResult` não nulo e que uma `ViewBag` tem o texto certo.

Eles continuariam 100% verdes com todos os `.cshtml` apagados, com o roteamento quebrado ou com o layout inválido. "100% passed" é 100% **do que foi escrito** — e o que foi escrito cobre pouco.

</details>

<details>
<summary>Onde o teste manual entra, se já existe teste automatizado?</summary>

Em outra camada. O unitário verifica **lógica isolada**; o manual verifica **experiência e critério** — layout responsivo em três resoluções, mensagem de erro que não revela se o usuário existe.

O erro de raciocínio é tratar como alternativas. São níveis da pirâmide: unidade (muitos, rápidos, baratos), integração (alguns), manual/exploratório (poucos, caros, insubstituíveis para julgamento humano).

</details>

<details>
<summary>Qual a diferença entre suíte estática e baseada em requisito?</summary>

A **estática** é uma lista curada à mão — você escolhe caso a caso.

A **baseada em requisito** é montada a partir de uma query de work items: cada User Story vira uma pasta e recebe os casos vinculados a ela. É essa que fecha a rastreabilidade — o Boards passa a mostrar cobertura de teste por história, sem ninguém manter a ligação manualmente.

</details>

---

## 🗺️ Status do Roadmap

| Fase | O que é | Status |
|---|---|---|
| 1 · **Testes automatizados na CI** | VsTest com 3 testes MSTest | ✅ [lab-05](lab-05-pipelines-build-classica.md) — 100% passed |
| 2 · **Conceitos e licenciamento** | O que é grátis e o que é pago | ✅ este documento |
| 3 · **Test Case como work item** | Grátis, via Boards | 🔜 |
| 4 · **Trial de 30 dias** | Plano `testar login` + Test Runner | 🔜 ⚠️ cancelar antes de vencer |
| 5 · **Suíte requirement-based** | Rastreabilidade história → caso | 🔜 depende de 4 |
| 6 · **Teste de integração** | `GET /Home/About` de verdade | 🔜 gratuito, só falta código |

---

---

## 📚 Leitura complementar

| Livro | Onde | Por quê |
|---|---|---|
| **#09** *Implementing Azure DevOps Solutions* | cap. 8 — Continuous Testing | Onde cada camada da pirâmide entra na esteira |

> Acervo completo e critério de uso em **[bibliografia.md](bibliografia.md)**. Os arquivos ficam em `materiais/livros/`, fora do controle de versão.

## 🔗 Conexões

| Tema | Onde |
|---|---|
| O build que roda os testes | [lab-05](lab-05-pipelines-build-classica.md) |
| Os testes analisados em detalhe | [projeto-build-mvc.md](projeto-build-mvc.md) |
| Work items e rastreabilidade | [lab-02](lab-02-boards-backlog-sprints-dashboards-queries.md) |
| Custos da organização | [README](README.md) |
| TDD e qualidade de código | [Devops/TDD](../../TDD/), [Devops/SonarQube](../../SonarQube/) |
| Recriar o ambiente | [ambiente-lab-azure.md](ambiente-lab-azure.md) |

---

## 💡 Reflexão Final

O módulo se apresenta como "testes", mas o que ele realmente ensina é **onde o Azure DevOps cobra**. Boards, Repos e Pipelines são generosos no gratuito; Test Plans é a exceção — e a mais cara delas.

Isso tem uma consequência prática que vale mais que o lab: **a decisão de usar Test Plans é de orçamento, não de engenharia**. Muita equipe pequena registra caso de teste em work item e executa numa planilha, porque US$ 52 por pessoa/mês não se justifica. O que se perde é a rastreabilidade automática — e essa perda é aceitável até certo tamanho de time.

E fica o desconforto útil de olhar para o `100% passed` da CI sabendo que os três testes passariam com a aplicação inteira quebrada. Métrica de teste sem leitura do que o teste cobre é teatro. A pergunta certa nunca é "quantos passaram", é "o que aconteceria se isto estivesse errado — algum teste falharia?".
