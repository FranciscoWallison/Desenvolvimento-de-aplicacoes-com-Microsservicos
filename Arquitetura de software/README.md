
# Arquitetura de Software

#### O que é Arquitetura?
```
	Organização de um sistema, contemplando seus componentes, os relacionamentos entre
estes e com o ambiente, e os princípios que governam seu projeto e evolução
```

#### Pilares
	° Organização de um sistema

	° Componetização
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
	- As pessoas consequem descobrir como usar?
#### - Memorável
	- É necessário reaprender sempre que for usar?
#### - Efetivo
	- Faz o seu trabalho

	
----
# "Nem tudo é bala de prata!"
----
# "Aprenda a martelar do que simplesmente à não usar o martelo!"
----


# Microsserviços

#### O que é um serviço?

	- Disponibiliza informação
	- Realização transações
	- Resolve problemas de negócio
	- Independente de tecnologia ou produto
	- Pode estabelecer comunicação com diversos "clientes"

----
	Exemplo:

 * SOA:Arquitetura Orientada a Serviços
 	- Serviçõs normalmente maiores baseados em funcionlidade
 	- Necessidade de ESB
 	- Single point of failure
 		º  Se ele cai o resto cai
 	- Compartilhamento de bancos de dados é comum
 	- Muitas vezes também podem ter sistemas monolíticos
 sendo utilizados como serviçõs


#### Arquitetura baseada em Microsserviços

	- Serviçõs pequenos com poucos responsabilidades
	- Maior tolerância a falhas
	- Totalmente independente
	- Cada serviço possui seu próprio banco de dados
	- Comunicação sícrona ou assícrona


#### Microsserviços não são para todas as situações :x:

	- Arquitetura complexa
	- Custo mais elevado
	- Necessidade de mais equipes para manter
	- Sistema precisa ser gande o suficiente para justificar
	- Gera problemas que normalmente você não tinha antes
	- Monitoramento complexo


#### [Motivos para usar Microserviços](https://github.com/FranciscoWallison/DESENVOLVIMENTO-DE-SISTEMAS-WEB) :heavy_check_mark:

	- Aplicação descentralizada
	- Equipes trabalhando simultaneamente
	- Ferramenta certa para cada serviço
	- Recontrução de codigo mais rápido (se necessário)
	- Manutenção facilitada
	- Escalabilidade aprimorada


#### [Microservices: Principais características](https://martinfowler.com/articles/microservices.html)

	- Componentização via serviçõs
	- Organização em torno do negócio
	- Estrutura baseada em Produtos. Não em projetos
	- Smart andpoints & Dumb pipes
	- Governança descentralizada
	- Descentralização no Gerenciamento de dados
	- Automação de infraestrutura
	- Desenhado para Falhar
	- Design evolutivo 

#### Microsserviços: Componentização via serviçõs
Componentização
____
	- "Componente é uma unidade de software independente que pode ser substituída ou atualizada"

----
	Desvantagens

	- Chamadas externas são mais custosas do que chamadas locais
	- Cruzamento entre componentes pode ser tornar complexo
	- Transações entre serviçõs são "grandes desafios"
	- Mudanças bruscas em regras de negócio podem afetar diversos serviçõs tornando o processo difícil de ser refeito

----
	Conceito importante

	- Um projeto é baseado em um ou mais produtos que trabalham em diferentes contextos.

#### Microserviços: Organização em torno do negócio

	- Time de desenvolvedores por produto
	- Muitas empresas tratam os times como "squads"
	- Cada "squad" é multidisciplinar
	- Cada "squad" é responsável por um ou mais produtos
	- Cada produto pode ter um ou mais serviçõs envolvidos
	- Cada Squad estar responsável por um área de negocio


# Microsserviçõs: Smart endpoints & dumb pipes

	- Exposição de APIs (ex: Rest)
	- Comunicação entre serviços
	- Comunicação sícrona e assícrona
	- Utilização de sistemas de mensageria (ex: RabitMQ)
	- Garantia de que um serviços foi executado baseada na execução das filas

## Microsserviçõs: Governança descentralizada
	- Ferramenta certa para o trabalho certo. Tecnologia podem ser definidas baseadas na necessidade do produto
	- Diferentes padrões entre squads
	- Contratos de interface de forma independente

## Microsserviçõs: Automação de infraestrutura
	- Cloud computing
	- Testes automatizados
	- Continuous delivery
	- Continuous integration
	- Load balancer / Autoscaling

## Microsserviçõs: Desenhado para falhar
	- Tolerância a falha
	- Serviços que se comunicam presisam de fallback
	- Logging
	- Monitoramento em tempo real
	- Alarmes

## Microsserviçõs: Design evolutivo
	- Produtos bem definidos podem evoluir ou serem extintos por razões de negócio
	- Gerenciamento de versões
	- Replacement and upgradebility

## Microsserviçõs: Comunicação assíncrona
	- Sempre tratar informações
	- Dar resposta sobre as requisições
	- Evita que processos fiquem travados quando recebem uma solicitação
	- Serviços de mensageria 

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
	- O Service Discovery tem a capacidade de localizar uma rede automaticamente, fazendo com que não haja necessidade de um longo processo de definição da configuração. A descoberta de serviço funciona por dispositivos que se conectam por meio de um idioma comum na rede, permitindo que dispositivos ou serviços se conectem sem qualquer intervenção manual. (ou seja, descoberta de serviço Kubernetes, descoberta de serviço AWS) (avinetworks)

# Backend for Frontend (BFF)
	- Garantir a performace do dispossitio que está soclicianto serviços.


# Domain Driven Design (DDD)

º É um conjunto de princípios com foco em:
````
	° Utilizado para aplicações complexas
	° Fácil de entender
	° Difícil de aplicar
	° Utilização de diversos padões de projetos
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
