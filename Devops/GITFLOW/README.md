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
 	º git checkout -b formulario_de_registro :x:
 	º git checkout -b bug_01 :x:
 - Pegando do master
 	º git push origin master :x: 

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
 		2 - git merge hotfix/recurso
 		3 - git checkput develop
 		4 - git merge hotfix/recurso 
```

#### Extensão Gitflow
```
	Gitflow possui  uma extensão para facilitar todo o processo, 
prorém a utilização da mesma é TOTALMENTE opcional.


	Para iniciar um projeto usando a extensão:
		- git flow init
```

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
