# Quem paga a conta é o contexto: o que 1.140 chamadas de um agente de IA ensinam sobre custo de tokens

### Como uma arquitetura de specs, sensores e subagentes reduz (e onde ainda desperdiça) tokens numa migração de legado

> **Status:** rascunho v0 · 05/10/2026.
> **Fonte dos números:** os registros de uso (`usage`) da sessão do Claude Code que conduziu a migração do SisFin
> (24/09 a 05/10/2026), agregados por script — só contagens, nenhum conteúdo. Custos em **dólares equivalentes na API**
> (Claude Opus 5.5: US$ 4 por milhão de tokens de entrada, US$ 20 de saída, US$ 0,20 de leitura de cache; escrita de
> cache com TTL de 1 hora a 2× a entrada). Quem usa assinatura não paga esses valores, mas eles medem o esforço.
> Nota relacionada: [Modernização de legado com SDD e agentes](spec-driven-modernizacao-com-ia.md).

---

## Introdução: quanto ganhamos (e quanto ainda dá para ganhar)

Migrei um sistema financeiro de 2016 (Laravel 5.3 + Vue 1) para NestJS + Vue 3 com um agente de IA trabalhando dentro de
uma arquitetura de **specs, sensores e subagentes**. Foram 9 módulos e mais de 500 testes, por cerca de **US$ 206 em
tokens** (equivalente na API, Claude Opus 5.5) — uns **US$ 23 por módulo**.

O que os registros de uso da sessão mostram, **medido**:

- **Cache de prompt: a conta seria cerca de 11 vezes maior sem ele** (US$ 2.159 contra US$ 198 na sessão principal).
  Esse ganho é da ferramenta; o papel da arquitetura é não quebrá-lo, mantendo estável o começo do contexto.
- **Compactação sem perder o fio: o contexto caiu de cerca de 960 mil para 55–75 mil tokens** e o trabalho continuou,
  porque o estado do projeto estava em arquivos (specs, decisões, andamento, memória). Cada chamada passou a custar
  **cerca de 93% menos** para reler o contexto.
- **Specs como memória comprimida: 419 KB de código legado viraram 114 KB de regras**, 73% menos para o agente carregar.
- **Subagentes como filtro: 14,3 milhões de tokens de exploração** (revisões de segurança) chegaram ao contexto principal
  como cerca de 10 mil caracteres de conclusão — menos de 0,1% do volume, por US$ 7,47.
- **Sensores em vez de leitura: ler um arquivo custou, em média, o mesmo que 13 execuções** de testes e scripts. Verificar
  com um script que responde uma linha é muito mais barato do que o modelo "olhar o código".

E o que **ainda não ganhamos**: rodei os 9 módulos numa sessão só, com contexto mediano de 444 mil tokens por chamada.
Estimo que uma sessão nova por módulo cortaria a leitura de cache entre 60% e 85% — **algo entre 30% e 45% da conta
total**. É estimativa, não medição; o experimento está na seção 8.

A tese do artigo cabe numa linha: **num agente de IA, quem paga a conta é o contexto relido a cada chamada**. A função da
arquitetura é manter pequeno o que o agente precisa reler.

---

## Sumário

0. [Introdução: quanto ganhamos](#introdução-quanto-ganhamos-e-quanto-ainda-dá-para-ganhar)
1. [O projeto medido](#1-o-projeto-medido)
2. [Para onde vão os tokens](#2-para-onde-vão-os-tokens)
3. [A fórmula que muda o foco](#3-a-fórmula-que-muda-o-foco)
4. [Quatro mecanismos da arquitetura que diminuem a conta](#4-quatro-mecanismos-da-arquitetura-que-diminuem-a-conta)
5. [Onde a arquitetura permitia economizar e eu não economizei](#5-onde-a-arquitetura-permitia-economizar-e-eu-não-economizei)
6. [Regras práticas](#6-regras-práticas)
7. [Limites desta análise](#7-limites-desta-análise)
8. [Próximos passos do artigo](#8-próximos-passos-do-artigo)

---

## 1. O projeto medido

O SisFin é um sistema financeiro multiempresa de 2017 em Laravel 5.3 + Vue 1. Um agente de IA (Claude Code, modelo
Opus 5.5) o migrou para NestJS + Prisma + PostgreSQL + Vue 3, módulo a módulo, dentro de uma arquitetura de trabalho
com quatro peças:

- **Specs versionadas** (`.specs/`): regras do legado com evidência (AS-IS), requisitos, decisões (ADR), design e
  tarefas do sistema novo (TO-BE).
- **Sensores computacionais:** paridade contra o legado rodando em Docker (o "oráculo"), espelho de leituras, testes,
  regras de camadas, rastreabilidade, testes de mutação.
- **Guias e portões:** hooks que bloqueiam edição do legado e código sem plano aprovado; aprovação humana amarrada ao
  hash do plano.
- **Subagentes** para revisão de segurança, cada um com o seu próprio contexto.

Em quatro dias de trabalho concentrado (24 a 27/09; os totais incluem também os ajustes de 28/09 e as poucas chamadas
desta análise, menos de 1%) saíram 9 módulos, 461 testes na API, 62 no front (42 unitários e 20 E2E) e 30 etapas registradas num
diário de bordo. A pergunta deste artigo é: **quanto isso custou em tokens, e o que da arquitetura fez a conta subir
ou descer?**

## 2. Para onde vão os tokens

| | Tokens | Custo equivalente (US$) | Parte do total |
|---|---:|---:|---:|
| Leitura de cache (o contexto relido a cada chamada) | 524,6 M | 104,92 | 53% |
| Escrita de cache (o que entrou de novo no contexto) | 8,1 M | 65,02 | 33% |
| Saída (tudo o que o agente escreveu: código, specs, respostas) | 1,42 M | 28,34 | 14% |
| Entrada sem cache | 2,3 mil | ~0,01 | — |
| **Sessão principal (1.137 chamadas)** | | **198,28** | |
| Subagentes (9 execuções, 185 chamadas) | | 7,47 | |
| **Total** | | **≈ 206** | ≈ US$ 23 por módulo |

E o mesmo volume **sem** cache de prompt: **US$ 2.159** — quase 11 vezes mais.

Três leituras:

1. **Escrever é barato.** Todo o código, os testes, as specs e o diário couberam em 14% da conta.
2. **O caro é reler.** Mais da metade do custo é o modelo relendo, a cada chamada, a conversa acumulada.
3. **O cache é o maior desconto, e ele vem do harness da ferramenta, não da minha arquitetura.** O mérito possível da
   arquitetura é não atrapalhar: manter o começo do contexto estável (instruções fixas, histórico só anexado).

## 3. A fórmula que muda o foco

Num agente que trabalha por ferramentas, cada chamada ao modelo reenvia o contexto inteiro. Então, aproximadamente:

```text
custo ≈ nº de chamadas × tamanho médio do contexto × preço da leitura
      + o que entra de novo × preço da escrita
      + o que o modelo escreve × preço da saída
```

Na sessão medida, o tamanho do contexto por chamada foi:

| Métrica | Tokens |
|---|---:|
| Mediana | 444 mil |
| Média | 469 mil |
| 90% das chamadas abaixo de | 819 mil |
| Máximo | 968 mil |
| Chamadas acima de 600 mil | 374 (33%) |

Daí o foco: **reduzir custo de agente é reduzir o produto "chamadas × contexto"**. Dá para atacar os dois fatores:
menos chamadas desperdiçadas (retrabalho, tentativa e erro) e menos contexto carregado em cada uma. É aqui que a
arquitetura entra.

## 4. Quatro mecanismos da arquitetura que diminuem a conta

### 4.1 Specs são memória comprimida: o estado mora em arquivo, não na conversa

O código do legado que importava para a migração somava **419 KB em 274 arquivos** (PHP, Vue, Blade, migrations). As
regras levantadas a partir dele (`.specs/legado/`) somam **114 KB em 29 arquivos**, cerca de 3,7 vezes menos. Por
módulo, as regras com o contrato HTTP ficaram entre **7,5 KB e 17 KB**: é isso que um agente precisa ler para
retomar o módulo, e não os controllers, repositories, listeners e componentes de onde as regras saíram.

A prova mais forte de que o estado estava nos arquivos veio de graça: a sessão passou por compactações (o histórico é
resumido quando o contexto enche). Nas duas maiores, o contexto caiu de **cerca de 960 mil para 55–75 mil tokens** e o
trabalho continuou de onde estava — porque as decisões, o andamento (`progresso.md`), o diário e uma memória de 12 KB
estavam em disco, e não só na conversa.

> Regra: tudo o que o agente precisaria "lembrar" deve existir em arquivo curto e versionado. A conversa é cache, não
> fonte de verdade.

### 4.2 Sensores com saída curta: verificar sem ler

Cada verificação feita por um script, e não pelo modelo "olhando o código", troca milhares de tokens por uma linha:

- a paridade contra o legado responde `24 caso(s), 1 falha(s)`;
- o espelho responde `20 rota(s), 0 com diferença`;
- a rastreabilidade responde quatro linhas com ✅.

Os números da sessão mostram a diferença de custo entre **executar** e **ler**:

| Ferramenta | Chamadas | Texto devolvido ao contexto | Média por chamada |
|---|---:|---:|---:|
| Execução de comandos (testes, sensores, scripts) | 894 | 1,09 M caracteres | ~1,2 mil |
| Leitura de arquivos | 105 | 1,70 M caracteres | ~16 mil |

**105 leituras de arquivo pesaram mais que 894 execuções.** Uma leitura custa em média o mesmo que 13 execuções, e o
peso dela fica no contexto pelo resto da sessão, relido em toda chamada seguinte. Dois cuidados ajudaram a manter os
comandos baratos:

- filtrar a saída na origem (`| tail -1`, `grep -E "Tests:|✕"`) em vez de despejar o log inteiro;
- mensagens de erro que **dizem o que fazer** (o sensor de camadas responde "mova a consulta para infra/ e exponha pelo
  serviço"). Uma mensagem que ensina evita uma rodada de investigação.

### 4.3 Subagentes isolam a exploração

As revisões de segurança (e outras tarefas de leitura pesada) rodaram em subagentes, cada um com o seu contexto.
Somadas, as 9 execuções leram **14,3 milhões de tokens** de entrada (explorando código, sondando a API local), custaram **US$ 7,47** e devolveram ao
contexto principal cerca de **10 mil caracteres** de relatório.

Se essa exploração tivesse acontecido na conversa principal, cada arquivo lido por elas passaria a ser relido em
todas as chamadas seguintes da sessão. O subagente paga a leitura uma vez, num contexto que morre ao terminar, e
entrega só a conclusão.

> Regra: tarefa que precisa ler muito e concluir pouco (revisão, busca ampla, levantamento) vai para um subagente.

### 4.4 Portões que evitam retrabalho

O token mais caro é o gasto para refazer algo. Alguns mecanismos da arquitetura existem justamente para cortar
retrabalho cedo:

- **aprovação humana amarrada ao hash do plano:** o agente não implementa um escopo que ainda vai mudar;
- **hook que bloqueia edição do legado:** o oráculo nunca é "consertado" por engano;
- **teste que falha antes da correção, e mutação depois:** um teste verde que não prova nada é descoberto na hora, e
  não semanas depois. Na sessão, isso pegou testes que passavam pelo motivo errado (um limite de requisições no lugar
  da falha real; uma corrida que o simulador instantâneo escondia);
- **revisão de segurança antes do commit:** os achados graves (um cliente pagante bloqueado por dois eventos do
  webhook processados ao mesmo tempo; uma liberação de CSP que abria um bypass) foram corrigidos enquanto o contexto
  do módulo ainda estava fresco.

Esta é a parte que **eu não consigo medir** com os dados que tenho: não existe a versão "sem portões" do mesmo projeto
para comparar. O argumento é qualitativo e está registrado no diário, achado por achado.

## 5. Onde a arquitetura permitia economizar e eu não economizei

A mesma arquitetura que permite retomar o trabalho a partir de arquivos permitiria **começar cada módulo numa sessão
nova**. Eu não fiz isso: os 9 módulos correram numa sessão só, que chegou a 968 mil tokens de contexto e passou um
terço das chamadas acima de 600 mil.

Uma estimativa grosseira, com dois cenários, só para dar ordem de grandeza (mesmas 1.137 chamadas):

```text
otimista  (contexto médio ~65 mil, o piso depois das compactações):
  1.137 × 65 mil × US$ 0,20 / milhão  ≈ US$ 15 de leitura  → total ≈ US$ 116  (−44%)

realista  (contexto crescendo dentro de cada módulo, média ~180 mil):
  1.137 × 180 mil × US$ 0,20 / milhão ≈ US$ 41 de leitura  → total ≈ US$ 142  (−31%)

medido    (sessão única, média 469 mil):                     US$ 105 de leitura  → total ≈ US$ 206
```

Ou seja: entre 60% e 85% a menos na leitura de cache, **30% a 45% da conta total** — e nenhuma das duas linhas é
medição. Cada sessão nova ainda paga a escrita do contexto inicial e relê as specs do módulo. Mas a direção é clara:
**o maior desperdício desta migração foi conversa longa demais, e não falta de arquitetura.**

Outros desperdícios que o diário registra:

- comandos de shell longos que quebravam e precisavam ser refeitos (virou lição recorrente: script em arquivo em vez
  de comando gigante);
- hipóteses sem sonda que custaram rodadas extras até o log mostrar a causa real.

## 6. Regras práticas

1. **Meça antes de otimizar.** O `usage` de cada chamada diz quanto foi leitura, escrita e saída. No meu caso, a saída
   era 14% da conta; otimizar a verbosidade das respostas mexeria pouco.
2. **Estado em arquivo, conversa descartável.** Specs, decisões, andamento e memória curtos e versionados; sessão nova
   por unidade de trabalho (módulo, tarefa).
3. **Verifique com scripts, e com saída curta.** Um sensor que responde uma linha vale mais que o modelo lendo o código
   para "conferir".
4. **Leia com parcimônia.** Ler um arquivo inteiro é a operação mais cara por chamada; busque o trecho certo.
5. **Delegue leitura pesada a subagentes** e traga de volta só a conclusão.
6. **Ponha portões antes do trabalho caro:** plano aprovado antes de implementar, teste vermelho antes de corrigir.
7. **Não quebre o cache:** instruções fixas no começo do contexto, histórico só anexado.

## 7. Limites desta análise

- **Não há grupo de controle.** Não existe o mesmo projeto feito sem a arquitetura; o que mostro é para onde foram os
  tokens e quais mecanismos atuaram, não um "economizou X%" contra uma alternativa.
- **Uma sessão, um projeto, um modelo.** Outro projeto, outro modelo ou outra forma de trabalhar mudam os números.
- **Custo equivalente na API.** Os valores usam a tabela de preços do Opus 5.5 vigente em setembro de 2026 e o TTL de
  cache de 1 hora; quem usa assinatura paga outra coisa.
- **Bytes como aproximação.** A comparação legado × specs está em bytes; código e prosa em português viram tokens em
  proporções diferentes. Para a v1, contar com o endpoint de contagem de tokens.
- **O que não está no `usage`:** o tempo humano de revisão e aprovação, que também é custo.

## 8. Próximos passos do artigo

Para a v1, os experimentos que transformam as estimativas em medição:

1. Rodar um módulo novo (ou refazer um pequeno) **numa sessão própria**, partindo só dos arquivos, e comparar
   "chamadas × contexto" com o mesmo tipo de módulo feito na sessão longa.
2. Contar os tokens reais das specs de um módulo contra o código do legado que elas resumem.
3. Marcar no diário as rodadas de retrabalho (comando refeito, hipótese errada) para estimar quanto delas os portões
   evitaram e quanto ainda escapou.
4. Um gráfico do tamanho do contexto ao longo da sessão (o "dente de serra" das compactações).
