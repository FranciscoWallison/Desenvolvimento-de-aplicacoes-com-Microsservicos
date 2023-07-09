
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

#### Arquitetura X Design:
```
Arquitetura: Visão de mais alto nível. Separação de camadas, pastas de aplicação.
Design: Visão de mais baixo nível. Como escrever cada classe. Quais padrões aplicar.
```

#### Tipos de arquitetura
	Software
		Tem o foco maior no código, tendo como objetivo de escalar
	Solução	
		Ficar mais próximo do cliente, entender o processo como um todo.
	Tecnológica
		Ferramentas especificas como banco, linguagem ou 'ferramentas'
	Corporativa
		Como a empresas vai se comportar com as tecnologias, com maior foco em governança 

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

# Usabilidade para STEVE KRUG
#### - ÚTIL
	- Faz algo que alguém precisa?
#### - Fácil de aprender
	- As pessoas conseguem descobrir como usar?
#### - Memorável
	- É necessário reaprender sempre que for usar?
#### - Efetivo
	- Faz o seu trabalho

# Métricas de software
#### 
```
Existem dois tipos de métricas no contexto de desenvolvimento de produtos de software: as métricas diretas, que são realizadas 
em termos de atributos observáveis, como por exemplo, esforço, tamanho e custo, e as métricas indiretas ou derivadas, que podem 
ser obtidas através de outras métricas, como por exemplo, complexidade, confiabilidade, e facilidade de manutenção. 
Quanto ao contexto, podem ser aplicadas em produtos ou em processos. Quando as métricas incidem diretamente 
no produto de software, são chamadas de métricas de predição, quando em processos de software, são comumente chamadas de 
métricas de controle e sua aplicação normalmente é realizada em processos já maduros e controlados.
```
Referência : [devmedia](https://www.devmedia.com.br/artigo-engenharia-de-software-21-metricas-de-software/15776)


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


# Domain Driven Design (DDD)

º É um conjunto de princípios com foco em:
````
	° Utilizado para aplicações complexas
	° Fácil de entender
	° Difícil de aplicar
	° Utilização de diversos padrões de projetos
````
## Entendendo (DDD)
-------
	1 - Domínio
		° Domínio é o coração do negócio que você está trabalhando. É baseado em um conjunto de idéias, conhecimento e processos de negócios.
	2 - Exploração de modelos de forma criativo
		° DDD preza que os desenvolvedores façam parte do processo de entender o negócio e todas os seus modelos nos mais diversos ângulos ao invés de simplesmente entrevistar especialistas.
	3 - Definir a falar a linguagem Ubígua baseada em um contexto delimitado
		° Linguagem Ubíqua é a linguagem falada no dia a dia no contexto da empresa. É a linguagem que utiliza as terminologias da realidade do negócio.

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
