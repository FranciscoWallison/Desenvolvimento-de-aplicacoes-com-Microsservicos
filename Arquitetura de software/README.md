
# Arquitetura de Software

#### O que é Arquitetura?
```
	Organização de um sistema, contemplando seus componentes, os relacionamentos entre
estes e com o ambiente, e os princípios que governam seu projeto e evolução.

	É a relação entre os objetos de negócios e suas restrições com os componentes a serem
criados e suas responsabilidade visando sua evolução de software.

	"É a organização funcional de sistema e suas componentes, suas relações, seu
ambientes, bem como os princípios que guiam seu design e evolução. (IEEE Standard 1471)"

	O processo de arquitetar um software estabelece que o que está sedo desenvolvido faça
parte de um conjunto maior.
```
#### Definições 
 - 1 - É uma "disciplina" da engenharia de software
 - 2 - Diretamente ligado ao processo de desenvolvimento de software
 - 3 - Afeta diretamente na estrutura organizacional
 - 4 - Formatação dos times
 - 5 - Estrutura dos componentes do software
 - 6 - "Organizações que desenvolvem sistemas de software tendem a produzir sistemas que são cópias
das estruturas de comunicação dessas empresas. (Melvin Conway)"

#### Tipos de arquitetura
	Software
		Tem o foco maior no código, tendo como objetivo de escalar
	Solução	
		Ficar mais próximo do cliente, entender o processo como um todo.
	Tecnológica
		Ferramentas especificas como banco, linguagem ou 'ferramentas'
	Corporativa
		Como a empresas vai se comportar com as tecnologias, com maior foco em governança 

#### Papel de Arquiteto(a) de Software
```
	Apesar de nem todos as organizações possuírem o cargo de arquiteto de software,
normalmente profissionais mais experientes como desenvolvedores seniors e tech leads
acabam realizando esse papel baseado em suas experiencias anteriores.

	Há empresas que apesar de não possuírem o cargo de arquiteto(a) de software,
possuem um departamento de arquitetura que auxilia os diversos times da organização
com questões arquiteturais.

	É papel do arquiteto de software definir rotina de testes e/ou esteira de teste.
	Arquiteto de software precisa pensar sempre no coração do software, ou seja, onde de fato irá gerar valor.
	Todo arquiteto de software deve realizar provas de conceitos em ferramentas, além de estabelecer e implementar processo de CI.
	
```
	- Transformar requisitos de negócios em padrões arquiteturais
	- Orquestrar pessoas desenvolvedores e experts de domínio
	- Entender de forma profunda conceitos e modelos arquiteturais
	- Auxilia na tomada de decisão nos momentos de crise
	- Reforça boas práticas de desenvolvimento
	- Todo software obrigatoriamente possui uma arquitetura, seja ela boa ou não.
	- O coração do software sempre terá que possuir a melhor arquitetura possível.

### Por que aprender arquitetura de software?
	- Poder navegar da visão macro para visão de um ou mais softwares
	- Entender quais são as diversas opções que temos para desenvolver a mesmas coisas e escolher a melhor solução para determinado contexto
	- Pensar a longo prazo no projeto e suas sustentabilidade
	- Tomar decisões de forma mais fria e calcular evitando assim ser influenciado(a) por "hypes" de mercado
	- Mergulho em padrões de projeto e de desenvolvimento e suas boas práticas

 ### Cudiados com o efeitos "Ivory Tower"
	° Arquitetos tem que andar junto ao time de desenvolvimento
	° Quando o arquiteto / time de arquitetura se isolam do dia dia do time de dev viram especialistas teóricos que pensam que estão resolvendo problemas, porém estão totalmente descolados da realidade.

### Estruturas de uma arquitetura:
	- Módulos, alocação e componente-conector
##### Estrutura CC (Componente-Conector)
- Interação entre elementos para garantir o funcionamento do sistema
- Componentes -> Comportamento  
	- services
	- client
	- servers
	- pipelines
- Interações -> Conectores
	- Como os componentes se comunicam

Exemplo
	- Um exemplo que em arquitetura é a hexagonal em cada porta/Componente tem um adaptador/Conector.
	- ACL = Anticorruption Layer tem a aplicação  e o ACL faz a ponte para os conectores.

##### Estrutura de Módulos
- Unidades de Software
- Pacotes
- Responsabilidades
- Camadas 
- Visão mais micro

° Perguntas de forma intencional aos módulos:
	- qual a principal responsabilidade de cada módulo?
 	- quais elementos de software cada módulo utiliza?
  	- o que o software realmente faz e do que ele depende?
   	- como cada módulo se relaciona?
	- qual o nível de acoplamento entre módulos, class, etc?
	

##### Estrutura de Alocação
- É a relação das estruturas componenete-conector e módulos e como elas se conectam com "não software":
- Tipo de computação
- Ambientes
- Testes
- Build
- Deployment

#### Pré-requisitos
	° Organização de um sistema
		- Usabilidade
		- Métricas
	° Componentização
		- Retrabalho
		- Funcionalidade distribuida

	° Relacionamento entre sistemas

	° Governança
		- Infraestrutura
		- Equipe
		- Arquitetura

	° Ambiente
		- Produção
		- Testes
		- Desenvolvimento

	° Projeto
		- Inicio
		- Meio
		- Fim
		- PMBOOK

	° Projeção
		- Visão de futuro de software

	° Cultura
		- Perfil de cada profissional e das equipes
		- DevOps (Desenvolvendo e Operacional)
----


#### Arquitetura X Design:
```
	Arquitetura: Visão de mais alto nível. Separação de camadas, pastas de aplicação.
Design: Visão de mais baixo nível. Como escrever cada classe. Quais padrões aplicar.
```
 - Arquitetura: Escopo global ou alto nível
 - Design: Escopo local

```
	Atividades relacionadas a arquitetura de software são sempre de design. Entretanto,
nem todas atividade de design são sobre arquitetura. O objetivo primário da arquitetura
de software é garantir que os atributos de qualidade, restrições de alto nível e os
objetivos do negócio, sejam atendidos pelo sistema. Qualquer decisão de design que
não tenha relação com este objetivo não é arquitetural. Todas as decisões de design
para um componente que não sejam “visíveis” fora dele, geralmente, também não são.
```
Fonte: [Elemar JR.](https://eximia.co/quais-sao-as-diferencas-entre-arquitetura-e-design-de-software/#:~:text=O%20fato-,Atividades%20relacionadas%20a%20arquitetura%20de%20software%20s%C3%A3o%20sempre%20de%20design,neg%C3%B3cio%2C%20sejam%20atendidos%20pelo%20sistema.)


## Pontos importantes
	Todos software possui uma arquitetura.
	Nem todas as arquiteturas são boas arquiteturas.
	Arquitetura inclui comportamentos.

# Usabilidade para STEVE KRUG
#### - ÚTIL
	- Faz algo que alguém precisa?
#### - Fácil de aprender
	- As pessoas conseguem descobrir como usar?
#### - Memorável
	- É necessário reaprender sempre que for usar?
#### - Efetivo
	- Faz o seu trabalho

### Decisões "erradas" para iniciar o desenvolvimento de um software
````
O problema esta no coração do software e não em suas extremidades.
````
 - Os problemas do waterfall
	* Com o advento das metodologias ágeis, esse problema diminuiu bastante, tendo em vista a necessidade de entregar algo de valor ao invés de apenas documentar.
 - Arquitetura de CRUD (Validar estrutura que representa a regra de negocio e escopo do produto)
 - Começar pelas ferramentas (Validar o contexto da entrega não a ferramenta primeiro.)
 - Começar sem testes
 - Começar sem processo de CI

## Middle-out
````
Foco no desenvolvimento dos componentes code e mais críticos do sistema.
Flexibilidade: Começar pelo meio permite fazer mais mudanças e eventualmente substituir
ou incorporar novos tecnologias sem precisar mudar o core do sistema.
Desenvolvimento incremental.
Facilidade na escola.
Menor complexidade na integração com outros sistemas.
````


## Métricas de software
```
Existem dois tipos de métricas no contexto de desenvolvimento de produtos de software: as métricas diretas, que são realizadas 
em termos de atributos observáveis, como por exemplo, esforço, tamanho e custo, e as métricas indiretas ou derivadas, que podem 
ser obtidas através de outras métricas, como por exemplo, complexidade, confiabilidade, e facilidade de manutenção. 
Quanto ao contexto, podem ser aplicadas em produtos ou em processos. Quando as métricas incidem diretamente 
no produto de software, são chamadas de métricas de predição, quando em processos de software, são comumente chamadas de 
métricas de controle e sua aplicação normalmente é realizada em processos já maduros e controlados.
```
Referência : [devmedia](https://www.devmedia.com.br/artigo-engenharia-de-software-21-metricas-de-software/15776)

## Exemplo de arquiteturas 

#### API REST
 - Payload, estrutura de responses, código de erro e sucesso.

#### Pattern ACL (Anti Corruption Layer)
 - Cria uma camada entre o seu domínio e o domínio de um sistema externo,
fazendo a tradução entre domínios, evitando assim a corrupção entre os sistemas.

#### Service Mesh
#### Conhecemos a ideia de ter um Gateway por cliente com o Edge Pattern
#### CQRS
#### Eventos assíncronos
#### Agregando métricas

# API Gateway
	- Controle, monitoramento e analise dos serviços feitos para as requisições.
	- Recebe todas as chamadas dos clientes e as roteia para os serviços correspondentes.
	- Pode tratar de aspectos de segurança e autenticação da aplicação 
----
	Exemplo:

	 * A função do gateway no gerenciamento da API *(redhat)*
		- Quando um cliente faz uma solicitação, o gateway de API a divide em várias solicitações, as direciona para os locais adequados, produz uma resposta e faz o monitoramento.
		- Um gateway de API faz parte do sistema de gerenciamento da API. Ele intercepta todas as solicitações de entrada e as envia por meio desse sistema, que processa diversas funções necessárias.
		- Em organizações que adotam uma abordagem de DevOps, os desenvolvedores usam microsserviços para criar e implantar aplicações de maneira rápida e iterativa. As APIs são um dos meios mais usados na comunicação entre microsserviços.


# Service discovery
	- Um processo que auxilia mecanismos de identificação dos serviços disponíveis e suas instâncias.
	- O Service Discovery tem a capacidade de localizar uma rede automaticamente, fazendo com que não haja necessidade
	de um longo processo de definição da configuração. A descoberta de serviço funciona por dispositivos que se conectam por meio
	de um idioma comum na rede, permitindo que dispositivos ou serviços se conectem sem qualquer intervenção manual. (ou seja,
	descoberta de serviço Kubernetes, descoberta de serviço AWS) (avinetworks)

# Backend for Frontend (BFF)
	- Garantir a performace do dispossitio que está soclicianto serviços.

#### Frameworks
_____
```
	- Frameworks são ferramentas e métodos que nos ajudam a focar 
	essencialmente no objetivo final. Frameworks nos ajudam a definir um padrão de trabalho.
```

#### [TOGAF](https://cio.com.br/voce-sabe-o-que-e-o-togaf-e-como-ele-vem-sendo-atualizado/)

 * Visão geral de tipos de arquiteturas:

 	- Negócio
 	- Sistemas de informação
 	- Tecnologia
 	- Planos de migração


#### [ISO/IEC/IEEE 42010:2011](https://en.wikipedia.org/wiki/ISO/IEC_42010)
 * Systems and software engineering -- Architecture description

	 - Lançada em 2011 pelo ISO
	 - Mais simplificado
	 - Formaliza os fundamentos da área de arquitetura de software.
	 
	 


#### Tech Stack
_____
```
	- Escolher ferramentas específicas do setor ou do processo
	- Leia avaliações de usuários para descobrir o que seus colegas pensam
	- Planeje a longo prazo
	- Criar uma lista final
	- Obter experiência prática
	- Ver uma demostração
```

## Load Balancer vs Gateway de API vs Backend for Frontend (BFF) simplificado.

#### Load Balancer

Quando você faz o check-in em um hotel, geralmente é recebido por um recepcionista.

O recepcionista verifica seus documentos, insere suas informações no sistema e te guia até o seu quarto.

Se houver muitos hóspedes, o hotel pode ter vários recepcionistas.

Os balanceadores de carga fazem um trabalho similar para a sua aplicação.

É uma ferramenta que distribui as solicitações recebidas entre vários servidores.

Além disso, os balanceadores de carga mantêm seu sistema disponível. Se um servidor falhar,
ele direciona a solicitação para outro servidor.

#### Gateway de API

Imagine um cenário onde uma empresa está conduzindo entrevistas para várias posições,
como Arquiteto de Tecnologia, Gerente de Engenharia e Engenheiro de Software.

Cada posição tem um painel de entrevista dedicado.

Agora, você não quer que os candidatos tenham que verificar cada sala para encontrar o painel correto.

É aqui que entra um coordenador que verifica o perfil do candidato e o direciona para o painel correto.

Para um sistema, o Gateway de API é esse coordenador.

Gateways de API também podem executar diferentes funções como autenticação,
limitação de taxa, registro de logs e caching.

#### Backend for Frontend (BFF)

Vamos levar nosso exemplo da entrevista adiante.

Para cada posição (Arquiteto, Gerente de Engenharia, Engenheiro de Software),
existem rodadas específicas de discussões.

Algumas rodadas são diferentes com base na posição,
mas algumas podem ser comuns para todas as posições (como a Rodada do Diretor).

Como você coordena isso para cada posição?

Backends para Frontends é o seu BFF (melhor amigo) neste cenário.
É um coordenador que cuida das rodadas específicas para um tipo particular de entrevista.

Em termos de sistema, BFF é o componente que pode cuidar dos diferentes requisitos de dispositivos.