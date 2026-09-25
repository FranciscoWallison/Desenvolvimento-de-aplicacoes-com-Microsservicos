# Mapeamento de Processos: AS-IS → TO-BE

### Onde estamos hoje × onde queremos chegar

Na TI e na **gestão de processos de negócio (BPM)**, **AS-IS** ("como está") é o mapeamento do **estado atual** dos processos, sistemas e fluxos de trabalho de uma empresa. Ele descreve como as atividades funcionam **na prática, hoje**, incluindo o que dá errado: falhas, gargalos, redundâncias e etapas manuais.

---

## 1. Para que serve o levantamento AS-IS

| Objetivo | O que revela |
| :--- | :--- |
| **Identificar problemas e gargalos** | Onde o processo trava, onde há retrabalho, onde se perde tempo e recurso. |
| **Entender a realidade operacional** | Como as tarefas são executadas de fato, e não como foram documentadas no papel anos atrás. |
| **Criar uma base de comparação** | O ponto de partida antes de implantar software, automação ou reestruturação. Sem ele, não dá para medir se o TO-BE melhorou algo. |

> ⚠️ **O AS-IS descreve o real, não o ideal.** O erro mais comum é mapear o processo "oficial" (o manual, o fluxograma antigo) em vez de observar e entrevistar quem executa. Os atalhos, planilhas paralelas e "jeitinhos" são justamente onde estão os problemas.

---

## 2. O par AS-IS × TO-BE

O AS-IS raramente é feito isolado: ele é a primeira metade de uma **transição**.

```text
   AS-IS (estado atual)          diagnóstico            TO-BE (estado futuro)
 ┌──────────────────────┐   ┌──────────────────┐   ┌──────────────────────────┐
 │ como funciona hoje   │──►│ gargalos, riscos │──►│ processo redesenhado,    │
 │ (com falhas e etapas │   │ retrabalho,      │   │ otimizado e corrigido    │
 │  manuais)            │   │ custo, demora    │   │ (tecnologia, automação)  │
 └──────────────────────┘   └──────────────────┘   └──────────────────────────┘
```

| | **AS-IS** | **TO-BE** |
| :--- | :--- | :--- |
| **Pergunta** | Onde estamos e como as coisas funcionam agora? | Onde queremos chegar? |
| **Natureza** | Descritivo (observação) | Prescritivo (proposta) |
| **Saída** | Mapa do processo atual + diagnóstico | Processo redesenhado + plano de transição |

O **diagnóstico** é a ponte entre os dois: cada mudança no TO-BE deve responder a um problema encontrado no AS-IS.

---

## 3. Exemplo prático: atendimento de suporte

**AS-IS (atual):** o cliente solicita suporte → o atendente anota o pedido em uma planilha Excel → envia um e-mail manual ao técnico → o técnico responde atualizando **outra** planilha.

**Diagnóstico:**

- Alto risco de erro humano (digitação, e-mail esquecido).
- Sem rastreabilidade: não se sabe o status de um pedido nem quem está com ele.
- Demora na resposta, com duas planilhas para manter em sincronia.

**TO-BE (futuro):** o cliente abre um chamado em um **portal self-service** → o sistema gera um **ticket automaticamente** no Jira/ServiceNow → o técnico responsável é **notificado via Slack**.

| Problema no AS-IS | Resposta no TO-BE |
| :--- | :--- |
| Registro manual em planilha | Ticket criado automaticamente pelo portal |
| E-mail manual ao técnico | Notificação automática no Slack |
| Duas planilhas desencontradas | Uma fonte única de verdade (a ferramenta de tickets) |
| Sem status/histórico | Ticket com status, responsável e histórico |

---

## 4. Conexões

- **Requisitos:** o TO-BE vira insumo direto para o [levantamento de requisitos](levantamento-de-requisitos.md). "O sistema deve gerar um ticket ao receber um chamado" é funcional, e "o técnico deve ser notificado em até 1 minuto" é não-funcional.
- **Modernização de sistemas:** o mesmo padrão aplicado a **software** (legado como AS-IS, sistema reescrito como TO-BE, com rastreabilidade de cada regra) está em [Spec-Driven Modernização com IA, seção 4](../../Arquitetura-de-Software/Modernizacao-de-Legado/spec-driven-modernizacao-com-ia.md#4-o-padrão-geral-as-is--to-be-com-rastreabilidade).
