
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
	Frameworks

```
	Frameworks são ferramentas e métodos que nos ajudam a focar 
essencialmente no objetivo fibal. Frameworks nos ajudam a deficnir um padrão de trabalho.
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


----

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


#### Arquitetura baseda em Microsserviços

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
	- Governaça descentralizada
	- Descentralização no Gerenciamento de dados
	- Automação de infraestrutura
	- Desenhado para Falhar
	- Design evolutivo 

#### Microsserviços: Componetização via serviçõs

	- "Componente é uma unidade de software independente que
pode ser substituída ou atualizada"

----
	Desvantagens

	- Chamadas externas são mais custosas do que chamadas locais
	- Cruzamento entre componentes pode ser tornar complexo
	- Transações entre serviçõs são "grandes desafios"
	- Mudanças bruscas em regras de negócio podem afetar diversos
serviçõs tornando o processo difícil de ser refeito

----
	Conceito importante

	- Um projeto é baseado em um ou mais produtos que trabalham em diferentes
contextos.

#### Microserviços: Organização em torno do negócio

	- Time de desenvolvedores por produto
	- Muitas empresas tratam os times como "squads"
	- Cada "squad" é multidisciplinar
	- Cada "squad" é responsável por um ou mais produtos
	- Cada produto pode ter um ou mais serviçõs envolvidos

----
	Cada Squad estar responsavel por um area de negocio