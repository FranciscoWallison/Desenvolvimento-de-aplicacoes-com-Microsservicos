## Arquitetura de Solução
- Processo de definição da estrutura, componentes, módulos,
interfaces de uma solução de software para satisfazer requisitos e
não funcionais bem como seu comportamento.
- Define / Sugere a stack de tecnologia, plataformas, ferramentas, 
infraestrutura que serão utilizados para implementar tal solução.
- Provê um blueprint do desenho e caminhos do desenvolvimento,
interação de uma solução para sua melhor eficiência.
- Normalmente é "praticada" em Sistemas de Software Enterprise

## Pessoa arquiteta de solução
- Diversos domínios
- Conhecimento de diversas tecnologia de acordo com experiências anteriores.
- Consegue levar com consideração contexto, restrições de negócios, aspectos
operacionais, custos e técnicos.
- Preparada para entregar soluções complexas para ambientes enterprise

## Soft Skills
- Saber se adaptar em diversos tipos de projetos e contextos
- Comunicação
- Liderança
- Pensamento Estratégico
- Inteligência Emocional
- Trabalho em Equipe
- Saber Ouvir

## Princípios para arquitetar um solução
- [Alinhamento com objetivos de negócio](https://www.youtube.com/watch?v=oeqPrUmVz-o)
  - Primeiro o cliente depois a tecnologia
- Flexibilidade
- Reusabilidade
  - Validar o que já existe.
- Interoperabilidade
  - Como outros sistemas iram se comunicar com esse sistema
  - Como esse sistema iram se comunicar com outros sistemas
- Mantenabilidade
  - Fáceis de interpretar manutenção e de implementação de funcionalidade
- Compliance com normas regulatórias
- Portabilidade


## Princípios que uma pessoa arquiteta leva em consideração para arquitetar uma solução

````
  Uma boa arquitetura de solução os casos de uso de negócios, a solução técnica e os serviços de infraestrutura subjacentes como componentes separados. Ele também pode ser usado para calcular o custo total de propriedade (TCO) de sistema, para que os gestores
  da empresa possam entender o impacto financeiro da solução.
````

#### TCO (Total Cost of Ownership)
 - Métrica financeira que representa o custo toral de comprar, desenvolver e operar uma
 solução ao longo do tempo.
 - Não inclui apenas o preço inicial da solução, mas também os custos de manutenção.
 ------------------------
 - Formas de custos:
   - Aquisição
   - Implementação
   - Manutenção
   - Operação
   - Inativação


## Enterprise Architecture X Solution Architecture

- A arquitetura da solução se concentra em soluções de software individuais, enquanto a arquitetura corporativa se concentra na estratégia de tecnologia de toda a organização.

- EA: Possui uma visão da corporação como um todo, já SA tem um foco normalmente em uma solução específica.
- EA: Planejamento, implementação da estrutura organizacional de uma corporação. Incluindo:
pessoas, processos e tecnologia.

- SA: Define a estrutura, características, comportamentos e relações entre um sistema específicos.

## Níveis de arquitetura de solução
- Arquitetura focada no negócio (Nível 0)
- Arquitetura focada na área técnica (Nível 1)
- Arquitetura focada no deployment (Nível 2)


### Nível 0 - Visão
- A visão deixa claro os objetivos da solução de uma forma mais empírica, lógica e que deixe claro sua razão de existir.
- Define os principais objetivos que vão guira a solução
- Apresenta uma visão de alto nível do que solução vai realizar, suas necessidades, bem como todos os envolvidos.

### Nível 0 - Escopo
- Define os limites da solução
- Problema que será resolvido, requisitos funcionalidades e não funcionais
- Componentes, sistemas e tecnologias.
- Considera restrições e pressupostos que podem influenciar no design da solução.

### Domínio e contextos
- Entendimento aprofundado do negócio
- Ver o negócio pelo de vista de seus participantes (Vendedor, parceiro, diferentes, departamentos, etc )
- Como esses contextos se comunicam e por qual "Linguagem"

### Domínio, contextos (Linguagem)
- Tipos de linguagens que se aplica no negócios utilizada na comunicação
  - Exemplos 1: 
    - Parceiros: Ticket
    - Suporte: Ticket/Atendimento
    - Vendedor: Ticket/Ingresso
  - Exemplos 2: 
    - Fruta: Manga
    - Roupa: Manga
    - Risos: Manga

### Lei de Conway
````
 A lei de Conway é um princípio que afirma que o design de um sistema é influenciado pela estrutura organizacional do grupo que o produz. Isso significa que a estrutura de comunicação de um grupo será refletida na estrutura dos sistemas que eles criam. A arquitetura de um sistema reflete os limites sociais do grupo que o criou.

 A estrutura de uma solução de software espelhará a estrutura de comunicação da organização que a construiu.
 
 A estrutura de uma solução de sistema são espelhos das estruturas das organizações e comunicação das organizações que a construiu.
````

### View e Viewpoints

- Uma view é uma perspectiva sobre uma solução, enquanto uma viewpoint é uma maneira de olhar para o sistema de um ângulo específico.

- "Uma Visão (View) é uma representação de uma ou mais aspectos estruturais de uma arquitetura que ilustra como arquitetura aborda uma ou mais questões mantidas por um ou mais seus stakeholders."

- "Um ponto de vista (Viewpoints) é uma coleção de padrões, modelos e convenções para construir um tipo de visão. Ele define as partes interessadas cuja preocupação são refletidas no ponto de vista e nas diretrizes, princípios e templates para a construção de seus pontos de vista."

### 4 + 1 View
````
O modelo “4+1” é usado para "Descrever a arquitetura de sistemas intensivos em software, com base no uso de múltiplas visualizações simultâneas".
Um conjunto de visualizações de arquitetura que fornecem diferentes perspectivas sobre uma solução de software.
Um modelo de arquitetura é algo que está em alto nível, que busca atender aos requisitos funcionais e não funcionais. As 5 diferentes visões que compõe o modelo “4+1” são:

Lógica;
Processo;
Físico;
Desenvolvimento;
E Cenário (casos de uso), sendo o quinto possível.
````

