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

````
	Design orientado a domínio é o conceito de que a estrutura e o idioma do seu 
código devem corresponder ao domínio comercial.
````
FONTE:ALURA


#### O que é domínio?
````
	Domínio é o 'commo core' o núcleo comum que representa a estrategia do negocio.
	Tem como objetivo representar as ideias, conhecimento e processo do negócio. 
	A decomposição de problema é uma das principais técnicas utilizadas no DDD,
dividindo a complexidade em partes menores e mais gerenciáveis.
````

#### Comunicação no ciclo de Desenvolvimento
````
	A linguagem das entregas ela nasce a partir das união entre o processo, feito pelo product owner e a equipe de 
desenvolvimento.   
````

#### Proposito de eventos de domínio no DDD
````
	São eventos que ocorrem no domínio do negócio e podem desencadear ações em outros contextos.
````

#### Agregados (Aggregates) no Domain-Driven Design (DDD)
````
	Os Agregados são um padrão de modelagem no DDD que consistem em um grupo de objetos relacionados
que são tratados como uma única unidade em relação a operações de modificação de dados.
Um Agregado possui uma raiz de Agregado que é a única porta de entrada para modificar o
estado interno do Agregado. Isso significa que todas as operações de modificação de dados
(criação, atualização e exclusão) ocorrem através da raiz do Agregado.
````

#### Design Estratégico no Domain-Driven Design (DDD)
````
	Tem uma relação mais íntima com o espaço do problema e a visão estratégica dos subdomínios.
````

####  Design Tático no Domain-Driven Design (DDD) 
````
Entidades, Agregados, Módulos, Eventos de domínios
````