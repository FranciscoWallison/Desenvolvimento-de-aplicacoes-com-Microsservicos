
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
 	- Serviçõs normalmente maiores baseados em funcionalidade
 	- Necessidade de ESB
 	- Single point of failure
 		º  Se ele cai o resto cai
 	- Compartilhamento de bancos de dados é comum
 	- Muitas vezes também podem ter sistemas monolíticos
 sendo utilizados como serviçõs


## Arquitetura baseada em Microservices

	- Serviços pequenos com poucos responsabilidades
	- Maior tolerância a falhas
	- Totalmente independente
	- Cada serviço possui seu próprio banco de dados
	- Comunicação síncrona ou assícrona


## Microservices não são para todas as situações :x:

	- Arquitetura complexa
	- Custo mais elevado
	- Necessidade de mais equipes para manter
	- Sistema precisa ser grande o suficiente para justificar
	- Gera problemas que normalmente você não tinha antes
	- Monitoramento complexo


## [Motivos para usar Microservices](https://github.com/FranciscoWallison/DESENVOLVIMENTO-DE-SISTEMAS-WEB) :heavy_check_mark:

	- Aplicação descentralizada
	- Equipes trabalhando simultaneamente
	- Ferramenta certa para cada serviço
	- Recontrução de codigo mais rápido (se necessário)
	- Manutenção facilitada
	- Escalabilidade aprimorada


## [Microservices: Principais características](https://martinfowler.com/articles/microservices.html)

	- Componentização via serviçõs
	- Organização em torno do negócio
	- Estrutura baseada em Produtos. Não em projetos
	- Smart andpoints & Dumb pipes
	- Governança descentralizada
	- Descentralização no Gerenciamento de dados
	- Automação de infraestrutura
	- Desenhado para Falhar
	- Design evolutivo 

# Microservices: Componentização via serviçõs
Componentização
____
	- "Componente é uma unidade de software independente que pode ser substituída ou atualizada"


Desvantagens
____

	- Chamadas externas são mais custosas do que chamadas locais
	- Cruzamento entre componentes pode ser tornar complexo
	- Transações entre serviçõs são "grandes desafios"
	- Mudanças bruscas em regras de negócio podem afetar diversos serviçõs tornando o processo difícil de ser refeito


Conceito importante
____
	- Um projeto é baseado em um ou mais produtos que trabalham em diferentes contextos.

# Microserviços: Organização em torno do negócio

	- Time de desenvolvedores por produto
	- Muitas empresas tratam os times como "squads"
	- Cada "squad" é multidisciplinar
	- Cada "squad" é responsável por um ou mais produtos
	- Cada produto pode ter um ou mais serviçõs envolvidos
	- Cada Squad estar responsável por um área de negocio


# Microservices: Smart endpoints & dumb pipes

	- Exposição de APIs (ex: Rest)
	- Comunicação entre serviços
	- Comunicação sícrona e assícrona
	- Utilização de sistemas de mensageria (ex: RabitMQ)
	- Garantia de que um serviços foi executado baseada na execução das filas

## Microservices: Governança descentralizada
	- Ferramenta certa para o trabalho certo. Tecnologia podem ser definidas baseadas na necessidade do produto
	- Diferentes padrões entre squads
	- Contratos de interface de forma independente

## Microservices: Automação de infraestrutura
	- Cloud computing
	- Testes automatizados
	- Continuous delivery
	- Continuous integration
	- Load balancer / Autoscaling

## Microservices: Desenhado para falhar
	- Tolerância a falha
	- Serviços que se comunicam presisam de fallback
	- Logging
	- Monitoramento em tempo real
	- Alarmes

## Microservices: Design evolutivo
	- Produtos bem definidos podem evoluir ou serem extintos por razões de negócio
	- Gerenciamento de versões
	- Replacement and upgradebility

## Microservices: Comunicação assíncrona
	- Sempre tratar informações
	- Dar resposta sobre as requisições
	- Evita que processos fiquem travados quando recebem uma solicitação
	- Serviços de mensageria 

## Microservices: Tipos
	- Data service
	- Business service
	- Translation service
	- Edge service
