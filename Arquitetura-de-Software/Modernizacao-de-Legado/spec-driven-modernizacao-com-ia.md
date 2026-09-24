# Modernização de Legado com Spec-Driven Development e Agentes de IA

### Engenharia reversa (AS-IS) → Especificação (TO-BE) → Implementação por agentes → Verificação de paridade

> Documento de estudo baseado em duas fontes:
> - **Shopify Engineering** — [Migrating the Shop app from React Native to native](https://shopify.engineering/shop-app-migration) (estudo de caso real)
> - **SoftDesign** — [Spec-Driven Development](https://www.softdesign.com.br/blog/spec-driven-development/) (conceito e níveis de maturidade)
>
> E numa estrutura de pastas `.claude/` + `.specs/` para reescrever um sistema legado com agentes — explicada arquivo por arquivo na seção 5.

---

## Sumário

1. [O problema: reescrever sem perder as regras](#1-o-problema-reescrever-sem-perder-as-regras)
2. [Spec-Driven Development (SDD)](#2-spec-driven-development-sdd)
3. [Estudo de caso: Shopify Shop App](#3-estudo-de-caso-shopify-shop-app)
4. [O padrão geral: AS-IS → TO-BE com rastreabilidade](#4-o-padrão-geral-as-is--to-be-com-rastreabilidade)
5. [A estrutura `.claude/` + `.specs/` arquivo por arquivo](#5-a-estrutura-claude--specs-arquivo-por-arquivo)
6. [Fluxo de trabalho passo a passo](#6-fluxo-de-trabalho-passo-a-passo)
7. [Verificação: como provar que o novo faz o mesmo que o velho](#7-verificação-como-provar-que-o-novo-faz-o-mesmo-que-o-velho)
8. [Armadilhas comuns](#8-armadilhas-comuns)
9. [Checklist](#9-checklist)
10. [Case prático: qual dos meus repositórios migrar](#10-case-prático-qual-dos-meus-repositórios-migrar)
11. [Glossário e referências](#11-glossário-e-referências)

---

## 1. O problema: reescrever sem perder as regras

Todo sistema legado carrega **conhecimento que não está escrito em lugar nenhum além do código**: um desconto que só vale para um estado, um arredondamento feito de propósito na terceira casa, uma trigger que recalcula saldo à noite. A documentação (se existe) está desatualizada; quem sabia já saiu da empresa.

Uma reescrita "do zero" falha quase sempre pelo mesmo motivo: **o sistema novo implementa o que as pessoas *acham* que o velho faz, não o que ele *realmente* faz.**

Os agentes de IA mudam a economia desse problema em dois pontos:

| Etapa | Antes (manual) | Com agentes |
|---|---|---|
| Ler e documentar o legado | Semanas de analista lendo código | Agente lê módulo inteiro e gera rascunho em minutos |
| Implementar a partir da spec | Proporcional ao tamanho do sistema | Paralelizável (várias sessões, várias worktrees) |
| Revisar e validar | Humano | **Continua humano** — e vira o gargalo |

A consequência prática: **o trabalho deixa de ser "escrever código" e passa a ser "escrever e validar especificações"**. É exatamente aí que entra o SDD.

---

## 2. Spec-Driven Development (SDD)

### Definição

> Especificações estruturadas se tornam a **principal fonte de verdade** do desenvolvimento, legíveis tanto por humanos quanto por agentes.

Em vez de o prompt ser descartável ("faz uma tela de faturamento"), a intenção fica **versionada no repositório**, ao lado do código, em arquivos que o agente lê antes de agir.

### Três níveis de maturidade

| Nível | O que significa | Quem é editado pelo humano |
|---|---|---|
| **Spec-first** | Escreve-se a spec antes, usa-se para guiar a IA, depois ela pode "morrer" | Spec (no início) + código |
| **Spec-anchored** | Spec e código vivem juntos e são atualizados na mesma PR | Spec + código, sempre em sincronia |
| **Spec-as-source** | O humano só edita a spec; o código é derivado (regenerável) | Só a spec |

Para modernização de legado, o alvo realista é **spec-anchored**: a spec do AS-IS é um artefato de *descoberta* (congela depois de validada) e a spec do TO-BE acompanha o código novo daí pra frente.

### SDD vs TDD vs Code-driven

| Aspecto | Code-driven | TDD | SDD |
|---|---|---|---|
| Fonte de verdade | Código | Testes | Especificação |
| Benefício principal | Flexibilidade | Qualidade técnica | Alinhamento com negócio + escala via IA |
| Limitação | Baixa previsibilidade | Testes não capturam o *porquê* do negócio | Exige manter a spec viva |

> 💡 **Não são excludentes.** Na prática, SDD *gera* os testes: cada critério de aceitação da spec vira um teste. SDD define **o quê**, TDD garante **que funciona**.

### Os artefatos típicos (o trio requirements / design / tasks)

Quase todas as ferramentas convergiram para o mesmo trio:

| Arquivo | Pergunta que responde | Quem aprova |
|---|---|---|
| `requirements.md` | **O quê** e **por quê** — histórias, critérios de aceitação | PO / negócio |
| `design.md` | **Como** — arquitetura, contratos, modelo de dados, decisões | Tech lead / arquiteto |
| `tasks.md` | **Em que ordem** — passos pequenos, cada um verificável | Dev (e é o que o agente executa) |

Os critérios de aceitação costumam usar a notação **EARS** (*Easy Approach to Requirements Syntax*), que é quase testável direto:

```text
QUANDO a fatura for emitida para cliente PJ com retenção de ISS
O SISTEMA DEVE descontar o ISS do valor líquido
E registrar a retenção no campo iss_retido
```

### Ferramentas

| Ferramenta | Como organiza | Observação |
|---|---|---|
| **Kiro** (AWS) | `.kiro/specs/<feature>/requirements.md · design.md · tasks.md` + `.kiro/steering/` (contexto fixo) | Requisitos em EARS; fluxo guiado fase a fase |
| **GitHub Spec Kit** | `memory/constitution.md` (princípios) + `specs/NNN-feature/spec.md · plan.md · tasks.md`; comandos `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement` | Agnóstico de agente (Claude Code, Copilot, Gemini…) |
| **Tessl** | Spec-as-source (código derivado da spec) | O nível mais radical |
| **Claude Code "na mão"** | `.claude/commands`, `.claude/agents`, `CLAUDE.md` + uma pasta de specs sua | É o que a estrutura da seção 5 faz |

> ⚠️ **Correções/leitura crítica do artigo da SoftDesign:**
> - **Lovable não é SDD** — é *vibe coding* (intenção solta em linguagem natural, sem spec versionada). Está na lista de ferramentas do artigo, mas representa justamente o oposto do que o SDD propõe.
> - Os números ("50% menos ciclo", "80% do código escrito por agentes", "100% de cobertura") são **auto-relatados por uma consultoria que vende o serviço**, sem metodologia publicada. Servem como indício, não como benchmark. "100% de cobertura de linhas" também não significa que as regras certas foram testadas.
> - A frase mais importante do artigo é o alerta: **sem spec atualizada, SDD vira "waterfall automatizado"**. Guarde essa.

---

## 3. Estudo de caso: Shopify Shop App

### Contexto

- **O quê:** app Shop (centenas de milhões de usuários) migrado de **React Native** (um código compartilhado) para **nativo** — **Swift/SwiftUI** no iOS e **Kotlin/Jetpack Compose** no Android.
- **Por quê agora:** o argumento clássico do React Native é "um código só, dois apps". Com agentes, manter **dois códigos nativos** ficou barato o suficiente para reconsiderar. Além disso, o próximo grande investimento em RN (a *New Architecture*) exigiria reescrever muitos módulos nativos de qualquer forma.

> 💡 A lição de arquitetura aqui é maior que o caso: **agentes alteram o custo relativo das opções**, e decisões tomadas sob a economia antiga (ex.: "cross-platform porque duplicar é caro") merecem ser reavaliadas. Isso é um ADR sendo revisitado.

### Fases

| Fase | Duração | Quem | Resultado |
|---|---|---|---|
| Prova de conceito | 1 semana | 1 engenheiro + agentes | Migrou telas RN → iOS nativo; mostrou que paridade *feature-a-feature* era viável |
| Migração completa | 12 semanas | Núcleo de 6 engenheiros; times de feature entram no meio para validar edge cases | App publicado nas lojas |

### O fluxo com subagentes

Eles estenderam o agente de código **Pi** com um fluxo em que cada subagente tem **um papel só**:

```text
 ┌───────────────┐   ┌───────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
 │ Inspeciona o  │──►│ Documenta o   │──►│ Planeja por  │──►│ Implementa   │──►│ Revisa a     │
 │ código RN     │   │ comportamento │   │ plataforma   │   │ (worktrees   │   │ paridade     │
 │ (UI, estado,  │   │ (spec AS-IS)  │   │ (iOS/Android)│   │  paralelas)  │   │ RN × nativo  │
 │ navegação,    │   │               │   │              │   │              │   │              │
 │ analytics,    │   │               │   │ ✔ aprovação  │   │              │   │              │
 │ a11y, dados)  │   │               │   │   humana     │   │              │   │              │
 └───────────────┘   └───────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

Dois detalhes de engenharia que valem ouro:

1. **Aprovação do plano atrelada a um hash do conteúdo.** Se o plano muda depois de aprovado, o hash muda e **a aprovação é invalidada automaticamente**. Isso impede o clássico "aprovaram a versão 1, o agente executou a versão 3".
2. **Tardis** — ferramenta interna que dá ao agente acesso estruturado ao **app rodando**: eventos, logs, estado, e a capacidade de mandar comandos. O agente valida a própria correção sem um humano clicar na tela.

### Verificação de paridade

Três requisitos de continuidade foram tratados como inegociáveis:

1. **Sessão do usuário persiste** — quem atualiza o app continua logado.
2. **Push notifications continuam chegando.**
3. **Eventos de analytics idênticos** — mesmos nomes, contagens e campos de payload, porque sistemas de recomendação downstream dependem deles.

O Tardis capturava screenshots e janelas de eventos em *checkpoints* e comparava RN × nativo, **ignorando campos que naturalmente diferem** (timestamps, IDs de sessão). Isso é um **teste de caracterização / golden master** automatizado — ver seção 7.

### Resultados

| Métrica | React Native | Nativo | Variação |
|---|---|---|---|
| Startup iOS | 3200 ms | 2466 ms | −23% |
| Startup Android | 4433 ms | 2233 ms | −50% |
| Sessões sem crash | 99,5%+ | 99,95%+ | ~10× menos crashes |
| Tamanho iOS | 67 MB | 68 MB | +1,5% |
| Tamanho Android | 293 MB | 184 MB | −37% |
| Build release Android | — | — | ~−75% |
| Scroll Android | — | 120 FPS | com pouca otimização |

### Lições (as que se generalizam)

- **Agentes rendem mais quando existe uma implementação de referência.** O código RN funcionava como *oráculo*: "faça igual a isto". Numa migração de legado você **sempre** tem esse oráculo — é a maior vantagem que você tem.
- **Código gerado pode cumprir o requisito e ainda assim degradar o sistema** — duplicação, *architectural drift*, problemas de performance. Conhecimento humano da plataforma foi essencial na revisão.
- **O fluxo de trabalho muda:** tarefas pequenas e claras, loop rápido de build/teste, revisão frequente.
- **Paridade deixa de ser automática.** Com RN, iOS e Android eram iguais "de graça"; agora "Android e iOS devem estar em paridade o tempo todo" virou uma **regra de processo**.

> ⚠️ **Leitura crítica:** o caso é de **front-end mobile com referência executável e bem testada**. Um legado de backend (procedures, triggers, jobs noturnos, integrações por arquivo) é mais difícil: o comportamento está espalhado entre código e banco, e observar "eventos" exige instrumentar o sistema velho. O padrão é o mesmo, mas a seção de verificação (7) pesa mais.

---

## 4. O padrão geral: AS-IS → TO-BE com rastreabilidade

Juntando SDD + Shopify, o padrão de modernização com agentes é:

```text
        LEGADO (oráculo)                         SISTEMA NOVO
  ┌──────────────────────────┐           ┌──────────────────────────┐
  │ código, banco, jobs      │           │ código gerado por agente │
  └────────────┬─────────────┘           └────────────▲─────────────┘
               │ engenharia reversa                   │ implementa (tasks)
               ▼  (agente só-leitura)                 │
  ┌──────────────────────────┐  decide   ┌────────────┴─────────────┐
  │ .specs/legado  (AS-IS)   │──────────►│ .specs/novo   (TO-BE)    │
  │ comportamento · regras   │  manter / │ requirements → design    │
  │ dados · dúvidas          │  corrigir │ → tasks                  │
  │ RN-FAT-001, RN-FAT-002…  │  descartar│ REQ-FAT-01 (origem: RN…) │
  └────────────┬─────────────┘           └────────────┬─────────────┘
               │                                      │
               └──────────► TESTES DE PARIDADE ◄──────┘
                    mesma entrada → mesma saída (golden master)
```

Mapeando o caso Shopify na estrutura:

| Shopify | Estrutura `.claude/` + `.specs/` |
|---|---|
| Subagente que inspeciona o RN | `agents/arqueologo.md` + `/mapear-modulo` |
| Documentação do comportamento | `.specs/legado/modulos/<m>/comportamento.md` e `regras.md` |
| Plano por plataforma, aprovado com hash | `.specs/novo/<m>/design.md` + `tasks.md` (aprovados) |
| Implementação em worktrees paralelas | tarefas de `tasks.md` executadas em worktrees |
| Revisão de paridade (Tardis) | testes de caracterização — **ausente na estrutura original, ver 5.5** |
| Revisão humana de arquitetura | `agents/security-reviewer.md` + code review humano |

---

## 5. A estrutura `.claude/` + `.specs/` arquivo por arquivo

```text
.claude/
├── CLAUDE.md                 # contexto: stack antiga, stack nova, regras do processo
├── commands/
│   ├── mapear-modulo.md      # /mapear-modulo <caminho> → gera spec as-is
│   ├── extrair-regras.md     # /extrair-regras → lista regras de negócio com evidência
│   └── spec-nova.md          # /spec-nova <feature> → gera requirements/design/tasks
└── agents/
    ├── arqueologo.md         # só lê o legado, nunca edita; cita arquivo e linha
    └── security-reviewer.md  # revisa a spec nova e o código gerado

.specs/
├── legado/                   # AS-IS: engenharia reversa do sistema atual
│   ├── inventario.md         # módulos, telas, endpoints, jobs, integrações
│   ├── dados.md              # tabelas, procedures, triggers, views
│   └── modulos/
│       └── faturamento/
│           ├── comportamento.md   # o que faz, entradas/saídas, fluxos
│           ├── regras.md          # regras de negócio com referência ao código
│           └── duvidas.md         # o que não dá pra entender só lendo código
└── novo/                     # TO-BE: o sistema reescrito
    └── faturamento/
        ├── requirements.md   # cada requisito aponta pra regra em legado/
        ├── design.md
        └── tasks.md
```

A ideia central: **`.claude/` é o *como trabalhar*** (processo, papéis, comandos) e **`.specs/` é o *conhecimento produzido*** (o que se descobriu e o que se decidiu). Um é ferramenta, o outro é entregável.

### 5.1 `CLAUDE.md` — o contexto fixo

É carregado automaticamente em toda sessão. Deve ser **curto e normativo** (regras, não tutorial):

```markdown
# Projeto: reescrita do ERP-Faturamento

## Stacks
- LEGADO (somente leitura): Delphi 7 + Oracle 11g, em `legacy/`. PL/SQL em `legacy/db/`.
- NOVO: .NET 8 + PostgreSQL 16, em `src/`. Arquitetura hexagonal (ver design.md de cada módulo).

## Regras do processo
1. Nunca edite nada em `legacy/`. Ele é o oráculo.
2. Toda regra de negócio tem ID estável `RN-<MOD>-NNN` em `.specs/legado/modulos/<mod>/regras.md`.
3. Todo requisito em `.specs/novo/` cita a(s) regra(s) de origem ou diz explicitamente `Origem: nova`.
4. Afirmação sobre o legado sem `arquivo:linha` é hipótese — vai para `duvidas.md`, não para `regras.md`.
5. Não implemente nada cujo `tasks.md` não esteja com `Status: aprovado`.
6. Cada task termina com teste passando. Regra migrada = teste de paridade.
```

### 5.2 `commands/` — os comandos de barra

Cada `.md` vira um `/comando`. `$ARGUMENTS` recebe o que vem depois do nome.

> 💡 Nas versões recentes do Claude Code, comandos customizados e *skills* (`.claude/skills/<nome>/SKILL.md`) convergiram — `commands/` continua funcionando; skills permitem anexar scripts e arquivos de apoio.

**`commands/mapear-modulo.md`**

```markdown
---
description: Engenharia reversa de um módulo do legado → spec AS-IS
argument-hint: <caminho-do-modulo>
---
Use o subagente `arqueologo` para mapear o módulo em `$ARGUMENTS`.

Produza/atualize em `.specs/legado/modulos/<nome>/`:
- `comportamento.md`: propósito, entradas, saídas, fluxos principais e alternativos,
  telas, endpoints, jobs e integrações que tocam este módulo.
- `duvidas.md`: tudo que não pode ser confirmado só pelo código.

Toda afirmação cita `arquivo:linha`. Não invente comportamento: se não achou, é dúvida.
Atualize `.specs/legado/inventario.md` se encontrar algo não listado.
```

**`commands/extrair-regras.md`**

```markdown
---
description: Extrai regras de negócio com evidência de um módulo já mapeado
argument-hint: <modulo>
---
Leia `.specs/legado/modulos/$ARGUMENTS/comportamento.md` e, via `arqueologo`,
o código referenciado. Liste em `regras.md` cada regra de negócio no formato:

### RN-<MOD>-NNN — <título curto>
- **Regra:** <frase declarativa>
- **Evidência:** `arquivo:linha` (e procedure/trigger, se houver)
- **Exemplo:** entrada → saída esperada
- **Confiança:** alta | média | baixa
- **Suspeita de bug?** sim/não + por quê

Nunca renumere IDs existentes. Regras removidas ficam marcadas como `~~obsoleta~~`.
```

**`commands/spec-nova.md`**

```markdown
---
description: Gera requirements/design/tasks do TO-BE a partir das regras AS-IS
argument-hint: <modulo>
---
Com base em `.specs/legado/modulos/$ARGUMENTS/regras.md` e `duvidas.md`:

1. `requirements.md`: um requisito por regra (ou grupo), critérios em EARS,
   com `Origem: RN-...` e `Decisão: manter | corrigir | descartar`.
   Dúvidas em aberto bloqueiam os requisitos que dependem delas.
2. PARE e peça aprovação do requirements antes de seguir.
3. `design.md`: componentes, contratos, modelo de dados, migração de dados, ADRs.
4. `tasks.md`: tarefas pequenas, cada uma com requisito(s) e teste(s) de aceite.
Ao final, acione `security-reviewer` sobre requirements e design.
```

### 5.3 `agents/` — subagentes com um papel só

O frontmatter define nome, quando usar e **quais ferramentas o agente pode usar**.

**`agents/arqueologo.md`**

```markdown
---
name: arqueologo
description: Lê o código legado e documenta comportamento e regras com evidência. Use para qualquer pergunta sobre o que o sistema atual faz.
tools: Read, Grep, Glob
---
Você é um arqueólogo de software. Você descreve o que o código FAZ, não o que deveria fazer.
- Cite sempre `arquivo:linha`.
- Separe FATO (visto no código) de HIPÓTESE (inferido).
- Procure regras fora do óbvio: triggers, procedures, jobs agendados, constantes mágicas,
  valores fixos em SQL, tratamento de exceção que "engole" erro.
- Comportamento que parece bug também é documentado — marque como suspeita, não corrija.
```

> ⚠️ **"Nunca edita" se garante com `tools:`, não com o prompt.** Escrever "não edite" no texto é um pedido; listar só `Read, Grep, Glob` é uma **restrição**: o agente simplesmente não tem `Edit`, `Write` nem `Bash`. Para reforçar, dá para adicionar em `settings.json` uma regra `deny` para `Edit(legacy/**)` — assim nem a sessão principal edita o oráculo por engano.

**`agents/security-reviewer.md`**

```markdown
---
name: security-reviewer
description: Revisa specs TO-BE e código gerado em busca de falhas de segurança e de regras de segurança do legado que se perderam.
tools: Read, Grep, Glob
---
Revise contra: autenticação/autorização (quem pode emitir/cancelar fatura?), validação de entrada,
injeção (SQL, comando), segredos em código, dados pessoais (LGPD), trilha de auditoria.
Atenção especial a controles que no legado estavam IMPLÍCITOS (ex.: permissão checada na tela
Delphi, não no banco) — na reescrita eles somem se ninguém os transformar em requisito.
Saída: lista de achados com severidade, arquivo:linha e requisito afetado.
```

### 5.4 `.specs/legado/` — o AS-IS

| Arquivo | Conteúdo | Dica |
|---|---|---|
| `inventario.md` | Módulos, telas, endpoints, jobs, integrações (arquivos, filas, FTP) | É o mapa para priorizar; inclua volume de uso se tiver (logs) |
| `dados.md` | Tabelas, procedures, triggers, views, quem lê/escreve cada uma | Triggers e jobs são onde as regras "invisíveis" moram |
| `comportamento.md` | O que o módulo faz, entradas/saídas, fluxos | Descritivo, com `arquivo:linha` |
| `regras.md` | Regras com **ID estável**, evidência, exemplo | O arquivo mais importante do projeto |
| `duvidas.md` | O que o código não explica | Cada dúvida precisa de **dono** e **status** |

Exemplo de `regras.md`:

```markdown
### RN-FAT-007 — Arredondamento do ISS por item
- **Regra:** o ISS é calculado e arredondado (2 casas, HALF_UP) item a item, e só depois somado.
- **Evidência:** `legacy/db/pkg_fatura.sql:412` (loop), `:418` (ROUND)
- **Exemplo:** 3 itens de R$ 33,33 com ISS 5% → 1,67 × 3 = R$ 5,01 (não R$ 5,00)
- **Confiança:** alta
- **Suspeita de bug?** não — contabilidade confirmou (ver DUV-FAT-003)
```

Exemplo de `duvidas.md`:

```markdown
| ID | Dúvida | Evidência | Quem responde | Status |
|---|---|---|---|---|
| DUV-FAT-003 | Arredondar por item é intencional? | pkg_fatura.sql:418 | Contabilidade (Ana) | ✅ intencional |
| DUV-FAT-004 | Job FAT_NOTURNO ainda roda? Tabela destino parece morta | jobs.sql:88 | Ops | ⏳ aberta |
```

### 5.5 `.specs/novo/` — o TO-BE

**`requirements.md`** — rastreável até a regra de origem:

```markdown
### REQ-FAT-04 — Cálculo de ISS
Origem: RN-FAT-007 · Decisão: **manter**

QUANDO uma fatura com itens sujeitos a ISS for calculada
O SISTEMA DEVE calcular e arredondar o ISS por item (2 casas, HALF_UP) antes de somar.

Aceite: caso de paridade `paridade/fat/iss-arredondamento.json` passa.
```

A coluna **Decisão** é o que transforma engenharia reversa em projeto: nem tudo que o legado faz deve ser migrado.

| Decisão | Quando | Consequência |
|---|---|---|
| **manter** | Regra válida | Teste de paridade exato |
| **corrigir** | Bug confirmado | Teste de paridade com **divergência esperada documentada** |
| **descartar** | Funcionalidade morta / sem uso | Registrar por quê (evita alguém "reinventar" depois) |

**`design.md`** — como no [Design Docs](../Design-Docs/README.md): componentes, contratos de API, modelo de dados, **plano de migração de dados** (no Shopify, "usuário continua logado" era exatamente isso) e decisões com trade-offs.

**`tasks.md`** — o que o agente executa:

```markdown
Status: aprovado · Aprovado por: Francisco · Hash: 3f9a1c…

- [ ] T1. Entidade ItemFatura + cálculo ISS por item (REQ-FAT-04) — teste: iss-arredondamento
- [ ] T2. Repositório Postgres de faturas (REQ-FAT-01) — teste: integração
- [ ] T3. Endpoint POST /faturas (REQ-FAT-01, 02) — teste: contrato + paridade emissao-pj
```

> 💡 **O "hash" é a ideia do Shopify:** gravar o hash do conteúdo na aprovação. Um hook/CI recalcula; se o `tasks.md` mudou e o hash não bate, a aprovação caiu e o agente não pode executar.

### 5.6 O que eu acrescentaria à estrutura

```text
.specs/
├── legado/modulos/faturamento/
│   └── ...
├── novo/faturamento/
│   └── ...
├── paridade/                  # ← NOVO: casos golden master (entrada + saída do legado)
│   └── faturamento/*.json
├── decisoes/                  # ← NOVO: ADRs (ex.: "por que descartamos o job noturno")
└── rastreabilidade.md         # ← NOVO (ou gerado por script): RN → REQ → Task → Teste
```

- **`paridade/`** — é o que tornou o Shopify confiável e é o elo que falta na estrutura original: sem isso, "o novo faz igual" é só opinião.
- **`decisoes/`** — decisões de *corrigir* e *descartar* precisam sobreviver às pessoas.
- **`rastreabilidade.md`** — pode ser gerado: um script que faz `grep` dos IDs e aponta **regra sem requisito** (algo vai se perder) e **requisito sem teste** (algo não está provado).

---

## 6. Fluxo de trabalho passo a passo

| # | Fase | Comando / agente | Saída | Porta de qualidade (humano) |
|---|---|---|---|---|
| 0 | Contexto | escrever `CLAUDE.md` | regras do processo | — |
| 1 | Inventário | `arqueologo` no repo todo | `inventario.md`, `dados.md` | Escolher o 1º módulo (pequeno, bem delimitado) |
| 2 | Mapear | `/mapear-modulo legacy/faturamento` | `comportamento.md`, `duvidas.md` | Dev sênior confere as citações |
| 3 | Extrair regras | `/extrair-regras faturamento` | `regras.md` | Negócio responde `duvidas.md` |
| 4 | Capturar paridade | script rodando o **legado** | `paridade/faturamento/*.json` | Casos cobrem cada RN |
| 5 | Especificar TO-BE | `/spec-nova faturamento` | requirements → design → tasks | Aprovação em cada um dos 3 |
| 6 | Implementar | tasks em worktrees paralelas | código + testes | Code review humano (drift, duplicação) |
| 7 | Revisar | `security-reviewer` + testes de paridade | relatório | Divergências = bug ou decisão documentada |
| 8 | Cutover | Strangler Fig / shadow | tráfego migrado | Métricas comparadas antes de desligar |

> 💡 Comece como o Shopify: **uma prova de conceito de uma semana num módulo só**. O objetivo não é entregar, é descobrir se o processo funciona para *o seu* legado (legibilidade do código, facilidade de rodar o velho para capturar paridade).

---

## 7. Verificação: como provar que o novo faz o mesmo que o velho

| Técnica | Como funciona | Quando usar |
|---|---|---|
| **Teste de caracterização / Golden master** | Roda o legado com entradas reais, grava as saídas; o novo tem que reproduzir | Sempre — é a base |
| **Comparação de eventos** (o que o Tardis fazia) | Compara nomes, contagens e campos de eventos/logs, ignorando campos voláteis | Quando o efeito é colateral (analytics, filas, e-mails) |
| **Shadow traffic / Parallel run** | Produção vai para os dois; só o legado responde; diferenças são registradas | Antes do cutover, com dados reais |
| **Strangler Fig** | Um proxy/roteador desvia funcionalidade por funcionalidade para o novo | Cutover incremental, com rollback por rota |

Cuidado com a comparação: **normalizar antes de comparar** (timestamps, IDs gerados, ordem de listas sem ordenação definida) — senão tudo "diverge" e o time passa a ignorar o relatório.

---

## 8. Armadilhas comuns

| Armadilha | Por que acontece | Mitigação |
|---|---|---|
| **Spec alucinada** | Agente descreve o que o código "deveria" fazer | `arquivo:linha` obrigatório; sem evidência → `duvidas.md` |
| **Regras invisíveis perdidas** | Estão em trigger, job, procedure, config — não no módulo lido | `dados.md` e inventário de jobs *antes* de mapear módulos |
| **Migrar o bug junto** | Paridade cega | Coluna `Decisão: manter/corrigir/descartar` |
| **Waterfall automatizado** | Spec gerada uma vez e nunca mais atualizada | Spec-anchored: spec muda na mesma PR que o código |
| **Aprovação obsoleta** | Plano muda depois do "ok" | Hash do conteúdo na aprovação (Shopify) |
| **Architectural drift** | Cada task resolvida isolada, sem visão do todo | `design.md` forte + review humano frequente |
| **Controle de segurança implícito some** | No legado estava na tela, não na regra | `security-reviewer` procura exatamente isso |
| **Contexto estourado** | Mandar o legado inteiro de uma vez | Um módulo por vez; subagente lê e devolve só o resumo |
| **IDs renumerados** | Agente "reorganiza" `regras.md` | Regra no `CLAUDE.md`: IDs são imutáveis |
| **Métricas de marketing** | "80% escrito por IA" vira meta | Medir o que importa: divergências de paridade, defeitos pós-cutover |

---

## 9. Checklist

- [ ] `CLAUDE.md` com stacks, oráculo somente leitura e regras de ID/evidência
- [ ] Subagente de leitura com `tools: Read, Grep, Glob` (restrição real, não pedido)
- [ ] `deny` de edição em `legacy/**` no `settings.json`
- [ ] Inventário inclui jobs, triggers, procedures e integrações — não só telas
- [ ] Toda regra tem ID estável, evidência, exemplo e nível de confiança
- [ ] Toda dúvida tem dono e status
- [ ] Todo requisito tem `Origem` e `Decisão`
- [ ] Casos de paridade capturados do legado **antes** de implementar
- [ ] Aprovação de requirements/design/tasks por humano (idealmente com hash)
- [ ] Rastreabilidade RN → REQ → Task → Teste sem órfãos
- [ ] Plano de migração de dados e de sessão/usuários no `design.md`
- [ ] Cutover incremental (Strangler Fig) com shadow/parallel run

---

## 10. Case prático: qual dos meus repositórios migrar

> Levantamento feito em 24/09/2026 sobre os 150 repositórios próprios (não-fork) de [FranciscoWallison](https://github.com/FranciscoWallison?tab=repositories), via `gh api`. Critérios de um bom case: **stack realmente legada**, **regras de negócio de verdade** (não só CRUD), **tamanho que cabe em semanas**, e **possibilidade de rodar o velho** para capturar paridade.

### Ranking

| # | Repositório | Stack atual | Por que sim | Por que não |
|---|---|---|---|---|
| 🥇 | [Laravel-Vue.js](https://github.com/FranciscoWallison/Laravel-Vue.js) | Laravel **5.3.18** (2016), PHP ≥5.6, Vue **1.0**, vue-router 0.7, Gulp/Elixir, Node 6.8, jQuery 2, Materialize 0.97 | Legado autêntico; domínio financeiro rico; ~226 PHP + 34 Vue (cabe em semanas); regras escondidas em eventos/listeners; multi-tenant; integração de pagamento; repo **pinado** com demo Heroku morta — a migração o ressuscita | Rodar o oráculo exige Docker com PHP 7.0/7.1 (vira parte do case) |
| 🥈 | [personal-react-native](https://github.com/FranciscoWallison/personal-react-native) | React Native 0.74 + Firebase, **2 apps publicados** na Play Store | **Espelho literal do Shopify** (RN → Kotlin/Compose + Swift/SwiftUI); usuários reais → paridade de sessão/push importa de verdade | Pouca regra de negócio (o Firebase faz o backend); 30 `.tsx` — é mais um case de UI que de regras |
| 🥉 | [EstoqueUTD](https://github.com/FranciscoWallison/EstoqueUTD) | PHP OO puro + MySQL (2015) | 23 arquivos PHP: ideal para a **prova de conceito de 1 semana** (testar o processo antes do case grande) | Pequeno demais para ser o case principal |

**Descartados:** `SistemasPedidos` (já é .NET Core + React — não há "legado" a migrar; aliás, versiona 586 `.dll` de `bin/`), `back-app-parceiro` / `agendaai-backend` (modernos — são *destino*, não origem), `roBrowserLegacy-RemoteClient-JS` (já é o **resultado** de uma migração PHP → Node; daria um case retroativo, não prospectivo), `CraftRO` (emulador em C, grande demais), `rapido` (fork do Cheat Engine), `fs04-sul` (material de aula).

### Por que o `Laravel-Vue.js` é o melhor case

**1. Regras de negócio invisíveis — exatamente o que o arqueólogo precisa achar.** O saldo da conta bancária não é atualizado no controller nem no model: é um *listener* de evento. Em [`app/Listeners/BankAccountUpdateBalanceListener.php`](https://github.com/FranciscoWallison/Laravel-Vue.js/blob/master/app/Listeners/BankAccountUpdateBalanceListener.php), `getValue()` decide o delta do saldo:

| Situação da conta | Conta a pagar (`BillPay`) | Conta a receber |
|---|---|---|
| Marcada como paga | saldo −valor | saldo +valor |
| Desmarcada | saldo +valor antigo | saldo −valor antigo |
| Valor alterado e continua paga | saldo + (antigo − novo) | saldo + (novo − antigo) |

E cada movimento gera um `Statement` (extrato) com o saldo resultante. Isso vira `RN-FIN-001..003` com exemplo numérico e teste de paridade — o tipo de regra que uma reescrita "de ouvido" perde.

**2. Dúvidas reais para o `duvidas.md`** (hipóteses a confirmar rodando o sistema, não conclusões):
- **Repetição de contas** ([`BillRepositoryTrait.php`](https://github.com/FranciscoWallison/Laravel-Vue.js/blob/master/app/Repositories/Traits/BillRepositoryTrait.php)): `create()` grava a conta e `repeatBill()` cria mais `repeat_number` cópias — com `repeat_number = 12` nascem **13 contas**? Intencional ou bug?
- **Atomicidade:** `addBalance()` e a criação do `Statement` não parecem estar numa transação — uma falha entre os dois deixa saldo e extrato divergentes.
- **Repetição mensal em dia 31:** o que `addDate()` faz em fevereiro?

**3. Controle de segurança implícito — prato cheio para o `security-reviewer`.** O isolamento entre clientes (multi-tenancy) é feito pelo pacote `hipsterjazzbo/landlord` + `AddCliebtTenantMiddleware`: um *scope global* injeta `client_id` em toda query. Na reescrita isso **some** se ninguém transformar em requisito explícito ("usuário do cliente A nunca lê conta do cliente B") com teste.

**4. Superfície completa e ainda contida:** contas a pagar/receber, contas bancárias, categorias em árvore (`kalnoy/nestedset`), extrato, fluxo de caixa, planos e assinaturas via **Iugu**, tempo real via **Pusher**, JWT (`tymon/jwt-auth` fixado num commit `dev-develop`), SPA + admin + site. São ~23 migrations — dá um `dados.md` completo.

**5. Rede de segurança zero:** `tests/` só tem o `ExampleTest.php`. Por isso a fase de **captura de paridade (golden master)** não é opcional — é o que torna a migração verificável.

### Stack de destino sugerida

| Camada | De | Para | Por quê |
|---|---|---|---|
| API | Laravel 5.3 | **NestJS + Prisma + PostgreSQL** | Já é o padrão maduro de [back-app-parceiro](https://github.com/FranciscoWallison/back-app-parceiro) (JWT access/refresh com revogação) — o `design.md` reaproveita decisões já tomadas |
| Multi-tenant | scope global (landlord) | Middleware de tenant + extensão do Prisma (ou RLS no Postgres) | Tornar explícito o que era implícito |
| Eventos de saldo | listener síncrono | Serviço de domínio **dentro de uma transação** | Corrige a atomicidade (decisão `corrigir`, documentada) |
| Front | Vue 1 + Elixir | **Vue 3 + Vite + Pinia** | Mesmo paradigma declarativo — como no Shopify, a paridade fica no comportamento, não na troca de paradigma |
| Pagamento | Iugu SDK 1.0.6 | Adapter atrás de uma interface (porta/adaptador) | Permite testar com fake e trocar gateway |

> 💡 Alternativa mais conservadora: **upgrade in-place para Laravel 11 + Vue 3**. É mais barato, mas rende um case mais fraco — a mesma linguagem esconde as regras; a troca de linguagem obriga a especificação a ser a ponte.

### Roteiro do case (≈ o formato Shopify)

| Semana | Entrega |
|---|---|
| 0 (PoC) | Rodar o fluxo inteiro no **EstoqueUTD**: CLAUDE.md, arqueólogo, 1 módulo, paridade, reescrita. Ajustar os comandos. |
| 1 | **Ressuscitar o oráculo**: `docker-compose` com PHP 7.1 + MySQL + Node 6 rodando o `Laravel-Vue.js` localmente |
| 2 | `inventario.md` + `dados.md` + mapear `bill-pays`, `bill-receives`, `bank-accounts` |
| 3 | `regras.md` + `duvidas.md` respondidas rodando o sistema; capturar golden master da API (requisição → resposta + saldo + extrato) |
| 4–6 | `/spec-nova` por módulo → implementação em NestJS por tasks, teste de paridade por regra |
| 7 | Front Vue 3; `security-reviewer` focado em tenant e JWT |
| 8 | Strangler Fig (proxy roteando `/api/*` módulo a módulo) + write-up do case com métricas (regras achadas, divergências, bugs corrigidos) |

---

## 11. Glossário e referências

| Termo | Significado |
|---|---|
| **AS-IS / TO-BE** | Estado atual documentado / estado desejado especificado |
| **Oráculo** | Implementação de referência que define a resposta correta para um teste |
| **EARS** | Notação de requisitos "QUANDO … O SISTEMA DEVE …" |
| **Golden master** | Saídas gravadas do sistema antigo usadas como gabarito |
| **Strangler Fig** | Substituir um sistema aos poucos, desviando rota por rota (Martin Fowler) |
| **Worktree** | Cópia de trabalho extra do mesmo repositório git — permite agentes em paralelo sem conflito |
| **Architectural drift** | Código que se afasta da arquitetura pretendida, mudança a mudança |

**Referências**

- Shopify Engineering — [Migrating the Shop app from React Native to native](https://shopify.engineering/shop-app-migration)
- SoftDesign — [Spec-Driven Development](https://www.softdesign.com.br/blog/spec-driven-development/)
- GitHub — [Spec Kit](https://github.com/github/spec-kit)
- Kiro — [Specs](https://kiro.dev/docs/specs/)
- Martin Fowler — [Strangler Fig Application](https://martinfowler.com/bliki/StranglerFigApplication.html)
- Michael Feathers — *Working Effectively with Legacy Code* (testes de caracterização)
- Claude Code — [Subagents](https://docs.anthropic.com/en/docs/claude-code/sub-agents) · [Slash commands](https://docs.anthropic.com/en/docs/claude-code/slash-commands)

Relacionados neste repositório: [Design Docs](../Design-Docs/README.md) · [Microsserviços](../Microsservicos/README.md) · [Arquiteturas de UI dinâmica mobile](../Mobile/arquiteturas-ui-dinamica-mobile.md)
