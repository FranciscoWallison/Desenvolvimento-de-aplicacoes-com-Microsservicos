## Objetivo
```
 * - Padronizar a estrutura de trabalho no controle de versão
 * - Trabalhando com equipes com o git
 * - Padão
 * - Legibilidade
 * - Processo 
```

## O que é o Gitflow
```
	Gitflow é um processo que visa utilizar o git como ferramneta para 
gerenciar a criações de novas features, correções de bugs e releases.
```

## Importância de padronização do processo de desenvolvimento

#### Exemplo :x:
```
 - Nova brash
 	º git checkout -b formulario_de_registro
 	º git checkout -b bug_01
 - Pegando do master
 	º git push origin master 

```

#### Exemplo :heavy_check_mark:
```
	º git checkout -b feature/registro
		- uma nova carecterística
	º git checkout -b hotfix/registro
		- corrigindo um erro na parte de registro
	º git push origin deveop
		- tudo q está no processo de desenvolvimento
	º git checkout master && git merge deveop
		- nunca vai dar um push no master
```

#### Como funciona o Gitflow

 - Master
```
 - Nunca comita diretamente do master

```
 - Delevop
```
 ° Features
 	-- Init
	 	1 - git checkout develop
	 	2 - git checkout -b feature/register
 	-- End
 		1 - git checkout develop
 		2 - git merge feature/register

 ° Releases
 	 -- Lança uma nova versão
 	 	1 - git checkout develop
 	 	2 - git checkout -b release/1.0.0
 	 	3 - git merge master
 	 	4 - git merge release/1.0.0

 	 	(Tag-1.0.0)

 ° Hotfix
 	--- O master tem que receber a correção repidamente
 		1 - git checkout master
 		2 - git merge hotfix/correcao-feature
 		3 - git checkput develop
 		4 - git merge hotfix/correcao-feature 

 ° Support
	--- Corrigir versões depreciadas
		1 - LTS
		
```

#### Extensão Gitflow
```
	Gitflow possui  uma extensão para facilitar todo o processo, 
prorém a utilização da mesma é TOTALMENTE opcional.


```

----
	Para iniciar um projeto usando a extensão:
	
		- $ git flow init
----

 ---- Dinamica de trabalho com Features - Release - Hotfix ----

#### Features
```
	 - Start
 		° git flow feature start feature/register
 	- Finish
 		° git flow feature finish feature/register
```

#### Release
```
	 - Start
 		° git flow release start 1.0.0
 	- Finish
 		° git flow release finish '1.0.0'
```

#### Hotfix
```
	 - Start
 		° git flow hotfix start hotfix/register
 	- Finish
 		° git flow hotfix finish hotfix/register
```

## Gitflow na prática
--- 
	Diretório está como exemplo e algumas traduções
---

#### $ git flow init 
Res:
```
		Repositório Git vazio inicializado em C:/Users/.git/
	Nenhum branches existe ainda. As branches básicas devem ser criadas agora.
	Nome da branches para versões de produção: [master]
	Nome do branches para o desenvolvimento do "próximo release ": [develop]

	Como nomear seus prefixos de branches de suporte?
	Branches de Feature ? [feature /]
	Branches Bugfix? [bugfix /]
	Release Branches? [release  /]

	Branches de correcções? [hotfix /]
	Branches de suporte? [Apoio, suporte /]
	Prefixo na tag de versão? []
	Diretório de ganchos e filtros? [C:/Users/.git/hooks]
```

---- 
	Lembrete
 * Validar atividade
 * Ao dar "$ git branch" irar mostra as bransh do 'master' e 'develop'. 
----

#### $ git flow feature start exemplo-gitflow
Res:
```
		Comutado para uma nova branches 'feature/exemplo-gitflow'

	Resumo das ações:
	- Um novo branch 'feature/exemplo-gitflow' foi criado, baseado em 'develop'
	- Você está agora na branches 'feature/exemplo-gitflow'

	Agora, comece a usar o commit como seu recurso. Quando terminar, use:

	$ git flow finish exemplo-gitflow

```

--- 
	Lembrete
 * A apos terminar sua funcionalidade add as usas alterações na 'stage area' e o commit.  
 * Recomendado fazer teste unitário 'nivel de Dev'.
---

#### $ git flow finish exemplo-gitflow
Res:
```
	Alterado para 'develop'
	Atualizando 94397ab..97f46a4
	Avanço rápido
	  index.html | 1 +
	  1 arquivo alterado, 1 inserção (+)
	  criar modo 100644 index.html
	Branch excluída feature/exemplo-gitflow (era 97f46a4).

	Resumo das ações:
	- A branch de feature 'feature/exemplo-gitflow' foi mesclada em 'develop'
	- A branch de feature 'feature/exemplo-gitflow' foi excluída localmente
	- Você está agora na branch 'develop'

```

---- 
	Lembrete
 * Ao dar "$ git branch" irar mostra as bransh do 'master' e 'develop'.
 * Recomendado fazer teste unitário 'nivel de Prod'.
----
	

----
	Criando a release
----

#### $ git flow release start 0.1.0

Res:
```
	Movido para a Branch 'release/0.1.0'

	Resumo das ações:
	- Um novo branch 'release/0.1.0' foi criado, baseado em 'develop'
	- Você está agora na branch 'release/0.1.0'

	Acompanhamento de ações:
	- Bata o número da versão agora!
	- Comece a consertar as correções de última hora na preparação do seu lançamento
	- Quando terminar, execute:

		git flow release finish '0.1.0'
``` 
----
	Lembrete
 * Aqui vocês estará na branch da sua entrega final, verifique as alteções e se tem correções na mesma.
 * Recomendado fazer teste de sistema/regressivo.
----

#### $ git flow release finish '0.1.0'
----

 * Mensagem para RELEASE
----

```
	Merge branch 'release/0.1.0'

	# Por favor, insira uma mensagem de commit para explicar porque esse merge é necessária,
	# especialmente se ele merge um upstream atualizado em um branch de tópico.
	#
	# Linhas começando com '#' serão ignoradas e uma mensagem vazia será anulada
	# o commit.
```
----

 * Mensagem para TAG
----

```
	#
	# Escreva uma mensagem para tag:
	# 0.1.0
	# Linhas começando com '#' serão ignoradas.
```

----
	Lembrete 
 * Depois de salvar as mensagens de 'release' e 'tag' e ira aparecera mais uma de confirmação.
----

	* As alerações foram feitas no MASTER e DEVELOP 

----
	O que foi alterado
----
Res:
```
	Comutado para branch 'master'
	Merge feito pela estratégia "recursiva".
	  index.html | 1 +
	  1 arquivo alterado, 1 inserção (+)
	  criar modo 100644 index.html
	Já em 'master'
	Comutado para branch 'develop'
	Já atualizado!
	Merge feito pela estratégia "recursiva".
	Liberação da branch deletada / 0.1.0 (era 97f46a4).

	Resumo das ações:
	- Liberação da branch 'release / 0.1.0' foi incorporada em 'master'
	- O lançamento foi marcado com '0.1.0'
	- A tag de lançamento "0.1.0" foi mesclada em "develop"
	- Liberação da branch 'release / 0.1.0' foi excluída localmente
	- Você está agora na branch 'develop'
```

#### $ git tag
```
	0.1.0
```

----
	Correção de erros 
----

#### $ git flow hotfix start ajustando-gitflow
```
	Comutado para uma nova branch 'hotfix / ajustando-gitflow'

	Resumo das ações:
	- Foi criada uma nova branch 'hotfix / ajustando-gitflow', baseada em 'master'
	- Você está agora no branch 'hotfix / ajustando-gitflow'

	Acompanhamento de ações:
	- Comece a confirmar seus hot fixes
	- Bata o número da versão agora!
	- Quando terminar, execute:

	     git flow hotfix finish 'ajustando-gitflow'
```

----
	Lembrete
 * A apos terminar sua coreção add as usas alterações na 'stage area' e o commit.  
 * Recomendado fazer teste unitário 'nivel de Dev/Prod'.
----


#### $ git flow hotfix finish ajustando-gitflow

Res:

```
	Branch 'hotfix /hotfix justando-gitflow'

	# Por favor, insira uma mensagem de commit para explicar porque essa merge é necessária,
	# especialmente se l merge um upstream atualizado em um branch de tópico.
	#
	# Linhas começando com '#' serão ignoradas e uma mensagem vazia será anulaa
	 
```

----
	Mensagem Para TEG
----


```
	#
	# Escreva uma mensagem para tag:
	# ajustando-gitflow
	# Linhas começando com '#' serão ignoradas.

```

--- 
	Mensagem de confirmação
---


```
	Comutado para branch 'develop'
	Merge feito pela estratégia "recursiva".
	  index.html | 2 + -
	  1 arquivo alterado, 1 inserção (+), 1 exclusão (-)
	Branch excluída hotfix/ajustando-gitflow (era 97b36b7).

	Resumo das ações:
	- Hotfix branch 'hotfix/ajustando-gitflow' foi fundido em 'master'
	- O hotfix foi marcado como 'ajustando-gitflow'
	- A tag de hotfix 'ajustando-gitflow' foi mesclada em 'develop'
	- A correção 'hotfix/ajustando-gitflow' foi eliminada localmente
	- Você está agora na branch 'develop'
```


#### $ git tag

```
	0.1.0
	ajustando-gitflow
```