## Objetivo

* - O que são Containers :x:
* - Como funcionam os Container :x:
* - Como o Docker funciona :x:
* - Principais comandos utilizado :x:
* - Dockerfile :x:
* - Trabalhando com imagens Docker :x:

## O que são containers?

```
	Um container é um padrão de unidade de software 
que empacota código e todas as dependências de 
uma aplicação fazendo que a mesma seja executada 
rapidamente de forma confiável de uma ambiente 
computacional para outro.
```

## Como funcionam os Container
```
	Existe processo para cada atividade que ele irar
executar.

	Processo (P) - O tempo for passando e o madurecimento de 
cada processo e esse processo tem sub-processos.

	Namespaces - é um nome dado para um processo que 
gera um conjunto de processo, nome do projeto Pai. É uma forma de 
isolamento dos processos. Namespaces = Isola os processos

```

## Namespaces
```
	Quando falamos de container ele representa um processo e 
	namespaces que isola esses processos.

	(P) PROCESSO PAI CONTAINER 1
		(p) filho container 1
		(p) filho container 1
		(p) filho container 1
	(P) PROCESSO PAI CONTAINER 2
		(p) filho container 2
		(p) filho container 2
		(p) filho container 2

	O container só ver os processo dele, isolando todos os demais
do sistema q ele esta sendo executados.

```

## Namespaces isolando ex
```
	º Pid
	° User
	° Network
	º File system
``` 

## CGroups
```
	Controla os recursos computacionais dos containes.

	Isolando recursos para que esses processos não
interfira nos recursos de outra maquina. 

	(P) PROCESSO
		memory = 500MB
		cpu_shares = 512


``` 

## File System OFS(Overlay File System)
```
	Não preciso colocar todas as dependências para rodar
diferente da virtualização.
	Quando for criar uma imagen só irar so essencial.  
```

## Imagens
```
	Trabalhar com camadas de dependencias e reutilizar processo 
em outas imagens.
```

## Dockerfile
```
	Arquivo declarativo de como vai ser a imagem, 
controi imagens.

	FROM: ImageNome

	RUN: Comandos ex: apt-get install

	EXPOSE: 8000

	Sempre que for dar um bild tera um nova imagem.
```

## Camada de Read / Write
```
	Alterando container na camada de leitura e escrita,
mas ela não altera imagem.
	Quando for dar um commit em uma imagem alterada serar 
colocada o conteudo na nova imagem, caso não quando for dar um bild 
no dockerfile ele irar gerar uma nova imagem com os dados já 
cadastrado.
``` 

## Aonde ficam as imagens?
```
	Image registry

	Como se foce um repositorio.

	Pull and Push
```

## Docker Host
```
	Volumes - Containers so imutáveis,
quando container morre, tudo se perde.

	Network - Comunicação entre containers

	daemon - api

	pull, push - Registry

```

## Docker Client
```
	° Containers
	° Run, Pull, Push
	º Volumes
	º Network
```

## [Instalando Docker](https://docs.docker.com/docker-for-windows/install/)

### linux 
Install docker

```
https://www.digitalocean.com/community/tutorials/como-instalar-e-usar-o-docker-no-ubuntu-16-04-pt
```

## Comandos Docker

#### docker run
```
	cmd : docker run --name teste -p 9090:80 hello-word
```

#### docker ps
```
	cmd: docker ps

		Mostrar os container rodando

	cmd: docker ps -a

		Aqui tão todos os container criado e q não esta rodando

```

#### docker rm
```
	cmd: docker rm  (name, ID)

		Remover o container pelo nome e ID

```

#### docker images
```
	cmd: docker images

		Verifica imagens já criadas

```

#### docker rmi
```
	cmd: docker rmi (name, ID)

		Remover o imagens pelo nome e ID.
		obs: remova primeiro os containers

```

#### docker criando volume
```
$ docker volume create --driver local --opt type=none --opt device=$(pwd) --opt o=bind teste_laravel_docker
or
$ docker volume create --driver local --opt type=none --opt device="$(pwd)" --opt o=bind teste_laravel_docker
```

#### docker-compose up -d OR docker-compose up -d --build
```
Criando as imagens e container
```

#### docker-compose down
```
Destruindo os container
```

#### docker exec -it app-exeplo bash
```
Entra dentro da SO do container
```

#### Criando images aprti do prod
```
docker build -t chico/laravel-optmized -f Dockerfile.prod .
```



[Workflow laravel](https://github.com/FranciscoWallison/laradocker-publicando-imagem)