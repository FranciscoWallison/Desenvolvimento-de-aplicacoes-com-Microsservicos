
# Arquitetura de Software

#### O que é Arquitetura?
```
	Organização de um sistema, contemplando seus componentes, os relacionamentos entre
estes e com o ambiente, e os princíios que governam seu projeto e evolução
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

# Microserviços

#### O que é um serviço?

	- Disponibiliza informação
	- Realização transações
	- Resolve problemas de negócio
	- Independente de tecnologia ou produto
	- Pode estabelecer comunicação com diversos "clientes"

----
	Exemplo:

 * SOA:Arquitetura Orientada a Srviçõs
 	- Serviçõs normalmente maiores baseados em funcionlidade
 	- Necessidade de ESB
 	- Single point of failure
 		º  Se ele cai o resto cai
 	- Compartilhamento de bancos de dados é comum
 	- Muitas vezes também podem ter sistemas monolíticos
 sendo utilizados como serviçõs


#### Arquitetura baseda em Microserviçõs

	- Serviçõs pequenos com poucos responsabilidades
	- Maior tolerância a falhas
	- Totalmente independente
	- Cada serviço possui seu próprio banco de dados
	- Comunicação sícrona ou assícrona


#### Microserviçõs não são para todas as situações :x:

	- Arquitetura complexa
	- Custo mais elevado
	- Necessidade de mais equipes para manter
	- Sistema precisa ser gande o suficiente para justificar
	- Gera problemas que normalmente você não tinha antes
	- Monitoramento complexo

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
