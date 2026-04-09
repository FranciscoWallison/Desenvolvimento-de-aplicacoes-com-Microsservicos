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
---

### **Qual é o objetivo principal do Domain Driven Design (DDD) de Vaughn Vernon?**

**Resposta Correta:** Criar uma arquitetura de software que reflete o domínio do negócio.

**Motivo:** O DDD, conforme abordado por Vaughn Vernon (e por Eric Evans, o criador do conceito), tem como objetivo central alinhar a arquitetura e o design do software com a complexidade e a riqueza do domínio de negócio. Isso significa que a estrutura do código, os nomes das classes e os relacionamentos entre os objetos devem espelhar a linguagem e os conceitos dos especialistas no negócio. As outras opções estão incorretas porque:

* **Focar apenas no desenvolvimento do front-end:** O DDD é uma abordagem para o domínio do negócio como um todo, não se limitando a uma camada específica como o front-end.
* **Minimizar a quantidade de código no projeto:** Embora o DDD busque clareza, seu foco não é a quantidade de código, mas sim a expressividade e a fidelidade ao domínio.
* **Reduzir o tempo de desenvolvimento de software:** DDD pode, a longo prazo, otimizar o desenvolvimento ao reduzir retrabalho e melhorar a compreensão, mas seu objetivo primário não é a velocidade, e sim a qualidade e a manutenção em domínios complexos.
* **Aumentar o uso de bibliotecas de terceiros:** O uso de bibliotecas é uma decisão de implementação e não um objetivo principal do DDD.

---

### **O que é um "bounded context" (contexto delimitado) em Domain Driven Design?**

**Resposta Correta:** Um contexto delimitado é uma maneira de dividir o domínio em partes menores e mais gerenciáveis.

**Motivo:** No DDD, um **Contexto Delimitado** é uma fronteira explícita dentro da qual um modelo de domínio específico é válido e consistente. Domínios de negócio complexos raramente podem ser representados por um único modelo coeso; diferentes partes do negócio podem usar os mesmos termos com significados sutilmente diferentes. O Bounded Context ajuda a gerenciar essa complexidade, permitindo que cada subdomínio tenha seu próprio modelo de domínio independente e coeso. As outras opções estão incorretas porque:

* **Refere-se a um conceito abstrato que não é aplicável ao DDD:** É um conceito fundamental e muito aplicável no DDD.
* **É uma camada de acesso a dados em uma aplicação DDD:** A camada de acesso a dados é uma parte da infraestrutura, não o conceito de Bounded Context em si.
* **É a parte do código que não está relacionada ao domínio do negócio:** Pelo contrário, está intrinsecamente ligada ao domínio do negócio, definindo onde um modelo de domínio específico é válido.
* **Um contexto delimitado refere-se a uma classe que encapsula vários domínios relacionados:** Não é uma classe, mas sim uma fronteira lógica para um modelo de domínio.

---

### **Quais são os dois principais blocos de construção em Domain Driven Design?**

**Resposta Correta:** Agregados e Eventos.

**Motivo:** Embora **Entidades** e **Objetos de Valor** sejam blocos de construção essenciais no DDD para modelar o domínio, quando se fala em "principais blocos de construção" para a arquitetura e a colaboração dentro de um sistema DDD, **Agregados** e **Eventos de Domínio** se destacam.

* **Agregados (Aggregates):** Definem os limites de consistência e transação. São agrupamentos de Entidades e Objetos de Valor que são tratados como uma única unidade para garantir a integridade dos dados e a consistência do domínio.
* **Eventos de Domínio (Domain Events):** Capturam fatos significativos que ocorreram no domínio. Eles permitem a comunicação desacoplada entre diferentes partes do sistema (incluindo Bounded Contexts diferentes) e são cruciais para a reatividade e a evolução do domínio.

As outras opções, embora mencionem conceitos do DDD, não representam os dois blocos de construção mais abrangentes e fundamentais na orquestração de um sistema DDD, especialmente como enfatizado em implementações mais modernas e distribuídas.

---

### **Como o padrão "Aggregate" (Agregado) é definido no contexto do Domain Driven Design?**

**Resposta Correta:** Um Agregado é um cluster de objetos que são tratados como uma única unidade em relação a operações de modificação de dados.

**Motivo:** Um **Agregado** serve como uma fronteira de consistência transacional. Ele garante que um grupo de objetos (Entidades e Objetos de Valor) relacionados entre si seja sempre consistente como um todo. As modificações em quaisquer objetos dentro de um agregado devem ser feitas através da raiz do agregado para manter a integridade dos invariants (regras de negócio que devem ser sempre verdadeiras). Isso simplifica o gerenciamento de complexidade e a consistência dos dados.

---

### **O que é o conceito de "Ubiquitous Language" (Linguagem Ubíqua) em DDD?**

**Resposta Correta:** É a prática de usar uma linguagem comum, compreensível para especialistas do domínio e desenvolvedores, durante todo o processo de desenvolvimento.

**Motivo:** A **Linguagem Ubíqua** é um dos pilares do DDD. Ela significa que todos os envolvidos no projeto (especialistas do negócio, desenvolvedores, testadores, etc.) devem usar a mesma terminologia para descrever o domínio. Essa linguagem deve ser incorporada diretamente no código, nos documentos, nas conversas e em todas as comunicações. Isso reduz mal-entendidos e garante que o software reflita com precisão as regras e conceitos do negócio.

---

### **Qual é o papel da camada de infraestrutura no DDD de Vaughn Vernon?**

**Resposta Correta:** É responsável por gerenciar a comunicação com sistemas externos e persistência de dados.

**Motivo:** No DDD, a **camada de infraestrutura** é responsável por todos os detalhes técnicos que não fazem parte da lógica de negócio principal. Isso inclui a persistência de dados (bancos de dados), comunicação com serviços externos (APIs, mensageria), UI (interfaces de usuário), e outras preocupações técnicas. O objetivo é isolar o domínio do negócio dessas preocupações técnicas, permitindo que o domínio seja puro e focado apenas na lógica de negócio.

---

### **Em Domain Driven Design, qual é o propósito do "Domain Event" (Evento de Domínio)?**

**Resposta Correta:** São eventos que ocorrem no domínio do negócio e podem desencadear ações em outros contextos.

**Motivo:** Um **Evento de Domínio** representa algo significativo que aconteceu no domínio de negócio. Eles são imutáveis e descrevem um fato passado. O propósito principal é desacoplar partes do sistema, permitindo que diferentes Bounded Contexts ou componentes reajam a mudanças no domínio sem estarem diretamente acoplados. Por exemplo, quando um "Pedido é Enviado" (um Evento de Domínio), isso pode desencadear a notificação do cliente, a atualização do estoque, e o faturamento, tudo de forma independente.

---

### **Como o DDD aborda a modelagem de complexidade em um projeto de software?**

**Resposta Correta:** Através de técnicas de decomposição de problemas, o DDD divide a complexidade em partes menores e mais gerenciáveis.

**Motivo:** O DDD foi criado especificamente para lidar com a complexidade em projetos de software. Ele faz isso através de várias técnicas:

* **Bounded Contexts:** Dividindo o domínio em subdomínios menores e independentes.
* **Agregados:** Gerenciando a consistência dentro de grupos de objetos.
* **Linguagem Ubíqua:** Reduzindo a ambiguidade e melhorando a comunicação.
* **Modelagem rica:** Focando em um modelo que reflete o negócio, em vez de apenas dados.

Todas essas ferramentas contribuem para a decomposição e gerenciamento da complexidade inerente a domínios de negócio sofisticados.

---

### **Qual é a importância do conceito de "Value Object" (Objeto de Valor) no Domain Driven Design?**

**Resposta Correta:** Value Objects são usados para representar conceitos que têm importância apenas no contexto de outra Entidade ou Agregado.

**Motivo:** Um **Objeto de Valor** (Value Object) é um objeto que descreve características de algo. Diferente de uma Entidade, ele não possui uma identidade única e é definido apenas por seus atributos. Por exemplo, um "Endereço" ou uma "Moeda" podem ser Value Objects. Sua importância é que eles garantem a imutabilidade (não mudam após a criação) e a validade por si mesmos. Eles simplificam o modelo de domínio, pois não precisam ser rastreados por identidade, e melhoram a clareza ao encapsular conceitos específicos.

---

### **O que é uma "Entity" (Entidade) em Domain Driven Design?**

**Resposta Correta:** Uma Entidade representa um objeto com identidade própria e é definida por suas características e comportamentos específicos no domínio do negócio.

**Motivo:** Uma **Entidade** no DDD é um objeto que possui uma identidade única e contínua ao longo do tempo, independentemente de suas propriedades. Por exemplo, um "Cliente" ou um "Pedido" são Entidades. Mesmo que suas características mudem, a identidade da Entidade permanece a mesma. A lógica de negócio e os comportamentos associados a essa identidade são encapsulados dentro da Entidade.

---

Espero que estas explicações detalhadas ajudem você a compreender melhor os conceitos do Domain Driven Design! Se tiver mais alguma dúvida ou quiser se aprofundar em algum ponto, é só perguntar.
