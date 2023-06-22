# Descomplicando ambiente de trabalho usando docker
- Tendo dificuldade de instalar todas as bibliotecas sempre que precisa criar um novo projeto?
- Problemas para buildar e utilizar as suas aplicações em qualquer Sistema Operacional desktop?

## [Instalando Docker](https://docs.docker.com/docker-for-windows/install/)

### linux 
Install docker [Digitalocean](https://www.digitalocean.com/community/tutorials/como-instalar-e-usar-o-docker-no-ubuntu-16-04-pt)

## Sobre Docker
* - O que são Containers
* - Como funcionam os Container
* - Como o Docker funciona
* - Principais comandos utilizado
* - Dockerfile
* - Trabalhando com imagens Docker

## [O que Docker?](https://blog.geekhunter.com.br/docker-na-pratica-como-construir-uma-aplicacao/#O_que_e_Docker)
```
	O Docker é um programa open source desenvolvido
pela Docker Inc. com a linguagem de programação GO.
Podemos dizer que as palavras chaves para o Docker são:
construir, entregar e rodar em qualquer ambiente (build, ship and run anywhere).

- blog.geekhunter.com.br
```

## O que são containers?

```
	Um container é um padrão de unidade de software 
que empacota código e todas as dependências de 
uma aplicação fazendo que a mesma seja executada 
rapidamente de forma confiável de uma ambiente 
computacional para outro.
```

## Analogia com comida 
````
Imagine que você é um cozinheiro e está preparando uma receita.
Para preparar a receita, você precisa de vários ingredientes,
como carne, legumes, temperos, etc. Além disso, você também precisa
de utensílios de cozinha, como panelas, facas, etc.

Agora, imagine que cada vez que você precisasse preparar essa receita,
você precisasse ir ao supermercado comprar todos os ingredientes e utensílios
novamente. Isso seria demorado e trabalhoso, certo?

Agora, imagine que você pudesse armazenar todos os ingredientes e utensílios 
em um conjunto de caixas, cada uma contendo todos os itens necessários para
preparar a receita. Sempre que você quisesse preparar a receita, bastaria abrir
a caixa correspondente e todos os ingredientes e utensílios necessários estariam
prontos para serem usados.

O Docker funciona de maneira semelhante. Em vez de ter que instalar todas as
dependências e configurações necessárias para executar um aplicativo em seu
computador, você pode empacotar todas essas dependências em um contêiner, que
é como uma caixa que contém todos os itens necessários para executar o aplicativo.
Quando você precisa executar o aplicativo, basta executar o contêiner e todas as
dependências e configurações necessárias já estarão lá, prontas para serem usadas.

Assim como as caixas que você usou para armazenar seus ingredientes e utensílios de
cozinha, você pode compartilhar seus contêineres com outras pessoas, permitindo que
elas executem o mesmo aplicativo em seus próprios computadores sem precisar instalar
todas as dependências e configurações novamente.

````

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
do sistema que ele esta sendo executados.
````

## Namespaces isolando ex
````
	º Pid
	° User
	° Network
	º File system
```` 

## CGroups
````
	Controla os recursos computacionais dos containes.

	Isolando recursos para que esses processos não
interfira nos recursos de outra maquina. 

	(P) PROCESSO
		memory = 500MB
		cpu_shares = 512
```` 

## File System OFS(Overlay File System)
````
	Não preciso colocar todas as dependências para rodar
diferente da virtualização.
	Quando for criar uma imagen só irar so essencial.  
````

## Layered File System
````
 - Toda imagem que baixamos é composta de uma ou mais camadas.
 - Essas camadas podem ser reaproveitadas em outras imagens, acelerando assim o tempo de download.
 - As camadas na imagem são apenas de leitura.
````

## Imagens
```
	Trabalhar com camadas de dependencias e reutilizar processo 
em outas imagens.
```

## Dockerfile
```
	Arquivo declarativo de como vai ser a imagem, 
constrói a imagen.

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

## Repositorio de imagens, existe?
```
	Image registry 
	Explo: hub.docker
	É um repositório que você pode publicar como Pull e usar na suma maquina com Push
```
### [Projeto com exemplos de publicação de imagens](https://github.com/FranciscoWallison/laradocker-publicando-imagem)

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
#### docker rmi -f $(docker images -q)
```
	cmd: docker rmi -f $(docker images -q)	
		Remover todos as imagens
		de uma só vez

```

#### docker image prune -a
```
	cmd: docker image prune -a
		Remover imagens que não estão 
		sendo utilizadas por nenhum contêiner

```
#### docker container prune
```
	cmd: docker container prune
	ou
	cmd: docker rm $(docker ps -a -q)  -f
		Remover todos os containers inativos 
		de uma só vez

```


#### docker stop -t 0 <CONTAINER ID>
```
	cmd: docker stop -t 0 <CONTAINER ID>

		Tempo de espera para parar o conteiner

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

#### docker-compose logs <NomeComtainer>
```
Mostra todos os log's gerado ao criar o container
```

#### Criando imagens partir do prod
```
docker build -t chico/laravel-optmized -f Dockerfile.prod .
```

#### Mostra as portas do container e local (poderá acessar pelo navegar)
```
docker port <CONTAINER ID>

Exp: definindo a porta 
 docker run -d -p 12345:8081 dockersamples/static-site
```


#### Criando Volumes
```
Windows (cmd),
	docker run -it -v "C:\Users\User\Documents\Volumes:/var/www" ubuntu 
	docker run -it -v %cd%/Volumes:/var/www ubuntu 
	
 Windows (PowerShell),
	docker run -it -v ${PWD}/Volumes:/var/www ubuntu 

Linux (bash),
	docker run -it -v "C:\Users\User\Documents\Volumes:/var/www" ubuntu 


Exmplo criando uma pasta 
	@5fb4bb4c5b1d:/# cd var/www/
	@5fb4bb4c5b1d:/var/www# touch novo-arquivo.txt
	@5fb4bb4c5b1d:/var/www# echo "Este arquivo foi criado dentro de um volume" > novo-arquivo.txt



Se der um "prume" os arquivos atrelado no seu local ou predefinido iram permanecer
	docker container prune
```

#### [Criando Comandos RUN, CMD e ENTRYPOINT](https://cursos.alura.com.br/forum/topico-diferenca-entre-run-cmd-e-entrypoint-103504)
```
 ° O ENTRYPOINT especifica um comando que sempre será executado quando o contêiner for iniciado.

 ° O CMD deve ser usado como uma maneira de definir argumentos padrão para um comando ENTRYPOINT ou para executar um comando em um contêiner.

 ° RUN permite executar comandos dentro da sua imagem do Docker. Esses comandos são executados uma vez no tempo de compilação e gravados na imagem do Docker como uma nova camada.
```

<details><summary><b>Comando rapidos Fonte Alura</b></summary>
<p>

docker ps - exibe todos os containers em execução no momento.

docker ps -a - exibe todos os containers, independentemente de estarem em execução ou não.

docker run -it NOME_DA_IMAGEM - conecta o terminal que estamos utilizando com o do container.

docker start ID_CONTAINER - inicia o container com id em questão.

docker stop ID_CONTAINER - interrompe o container com id em questão.

docker start -a -i ID_CONTAINER - inicia o container com id em questão e integra os terminais, além de permitir interação entre ambos.

docker rm ID_CONTAINER - remove o container com id em questão.

docker container prune - remove todos os containers que estão parados.

docker rmi NOME_DA_IMAGEM - remove a imagem passada como parâmetro.

docker run -d -P --name NOME dockersamples/static-site - ao executar, dá um nome ao container.

docker run -d -p 12345:80 dockersamples/static-site - define uma porta específica para ser atribuída à porta 80 do container, neste caso 12345.

docker run -d -P -e AUTHOR="Fulano" dockersamples/static-site - define uma variável de ambiente AUTHOR com o valor Fulano no container criado.


Dicas VOLUMES

Que Container são voláteis, isso é, ao remover um, removemos os dados juntos
Para deixar os dados persistente devemos usar Volumes
Que volumes salvos não ficam no container e sim no Docker Host
Como criar um ambiente de execução node.js
Segue também uma breve lista dos comandos utilizados:

docker run -v "[CAMINHO_VOLUME_LOCAL:]CAMINHO_VOLUME_CONTAINER" NOME_DA_IMAGEM - cria um volume no respectivo caminho do container, caso seja especificado um caminho local monta o volume local no volume do container.
docker inspect ID_CONTAINER - retorna diversas informações sobre o container.

</p>
</details>

#### Conf Docker-machine
```
docker-machine ssh default
sudo vi /etc/resolv.conf
change nameserver to 8.8.8.8

Conf shell 
Exec command shell "#!/bin/bash"
entrypoints

```


#### Docker Engine
````
Responsável por fazer o meio de campo entre os containers e o SO.
````
#### Docker Hub
````
Provê um repositório com muitas aplicações para você usar em sua infraestrutura.
````
#### Docker Swarm
````
Tecnologia permite o uso de múltiplos docker hosts.
````

#### Containers VS VM(Máquinas Virtuais)


## Vantagens dos Containers
````
 - Agilidade na hora de subir novas imagens de atualizações
 - Melhor controle do uso dos recursos do sistema operacional.
 - Trabalhar com diferentes versões de bibliotecas e linguagens.
````



## Vantagens das máquinas virtuais
````
 - Reduzindo assim os custos de luz e rede
 - Reduzindo gastos de servições fisicos
 - Ociosidade do hardware.
````

## Desvantagens das máquinas virtuais
````
 - Possuem um custo de hardware para manter suas funcionalidades.
 - Configurações iniciais e atualizações frequentes do SO
 - Manter vários sistemas operacionais. 
````
## Possiveis erros e soluções
```
Building app
Traceback (most recent call last):
  File "site-packages\docker\utils\build.py", line , in create_archive
OSError: [Errno 22] Invalid argument: 'public\\storage'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
```
```
   - docker-compose kill
   - docker rmi $(docker images -a -q)
   - docker-compose up --force-recreate
```

### [Vídeo Fazendo consulta utilizando PDO/php com mariadb + docker](https://www.youtube.com/watch?v=FzPgZ84lP94)
 <details><summary><b>Codigo utilizando</b></summary>
<p>
	
### docker-composer.yml
````
	
version: '3' # vs mais atual
services:
  # CONFIGURAÇÕES MARIADB
  db_mariadb:
    container_name: db_mariadb
    image: mariadb:latest
    tty: true
    ports:
      - "3307:3306"
    environment:
      - MARIADB_DATABASE=test
      - MARIADB_ROOT_PASSWORD=root
      - MARIADB_USER=root
````
	
### teste_mariadb.php
	
````
<?php
$user = 'root';
$pass = 'root';
$dsn = 'mysql:dbname=test;host=127.0.0.1;port=3307';

try {
    $dbh = new PDO($dsn, $user, $pass);
    foreach($dbh->query('SELECT * from FOO') as $row) {
        print_r($row);
    }
    $dbh = null;
} catch (PDOException $e) {
    print "Error!: " . $e->getMessage() . "\n";
    die();
}
?>
````

</p>
</details>
	

# Meus projetos com docker

[Workflow-laravel](https://github.com/FranciscoWallison/laradocker-publicando-imagem)

[EnvioEailsComWorkes](https://github.com/FranciscoWallison/Projeto-EnvioEailsComWorkes)

[Videos-laravel](https://github.com/FranciscoWallison/laravel-microservice-docker)

[Api-nodejs-express-email](https://github.com/FranciscoWallison/nlw-04-nodejs)

[Api-nodejs-express-socket](https://github.com/FranciscoWallison/nlw-05-nodejs)
	
[Api-nodejs-express-jwt](https://github.com/FranciscoWallison/nlw-06-nodejs)

[Word-Cloud-Spotify](https://github.com/FranciscoWallison/wordCloudSpotify)

[Sistemas_de_Pedidos](https://github.com/FranciscoWallison/SistemasPedidos)
	
