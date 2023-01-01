
## Introcução
````
Uma ferramenta de integração contínua de 
código aberto, fácil de instalar e configurar. 
````

## Objetivo
````
- Automação
- Produtividade
- Gestão de qualidade
- Segurança
````

## Criando Ambiente JENKINS docker-compose
Crie um arquivo chamado ````docker-compose.yml````, configurações da imagem 
````
version: '3' # vs mais atual
services:         
    jenkins:
        build: jenkins
        privileged: true
        user: root
        ports:
            - 8080:8080
            - 50000:50000
        container_name: jenkins
````
Rode o comando para criar o container com as informações da imagens: 
````
docker-compose -f docker-compose.sonar.yml up -d
````

Ao finalizar o build ele irar criar uma rota em ````http://localhost:8080/````.

## Pre-configuração hook no GitHub

Iremos criara o server utilizando.

Primeiro instale 
````
npm install -g localtunnel
````

Depois rode o comando 
````
lt --port 8080
````
Ele irar retorna uma mensagem como essa: 
````your url is: https://fuzzy-deer-73.loca.lt````, criar uma ponte, do nosso local do JenKins.

No seu repositório do GitHub 

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/github_hooks.png" width="450" />

OBS:: Pode esta utilizando outras alternativas, mas precisamos que a aplicação do Jenkins este já apontando em um HTTPS publico, lembrando de sempre por arrota ````SUA_URL/github-webhook/```` dando como o exemplo ````https://fuzzy-deer-73.loca.lt/github-webhook/````

________________________________
Tem que fazer o login com o heroku para que o Jenkins possa ter acesso e fazer o deploy. Com o comando ````docker exec -it jenkins bash````
teremos a cesso ao bash do container, a onde iremos fazer o login no heroku e criar o aplicativo para o deploy. 

Dentro do container execute o comando: 
````
 $  heroku login -i
    heroku: Enter your login credentials
    Email: me@example.com
    Password: ***************
    Two-factor code: ********
    Logged in as me@heroku.com
````

Quando terminar de efetuar o login o Jenkins agora pode acessar e fazer o build, alem de publicar a aplicação.

## Comando para deploy no Heroku usando docker
<details><summary><b>Caso queria publicar usando docker no Heroku sequencia básica.</b></summary>
<p>

## Todo os comandos foram tirados da DOC do Heroku

Para criar um app novo 
````
$   heroku create
    Creating app... done, ⬢ thawing-inlet-61413
    https://thawing-inlet-61413.herokuapp.com/ | https://git.heroku.com/thawing-inlet-61413.git
````
- No projéto iremos usar o app com o nome ````nlw-05-nodejs```` como exemplo.


Comando que irar criar uma nova imagem no registry do Heroku
````
heroku container:push web --app nlw-05-nodejs
````

Comando que irar liberar a imagem criada no registry do Heroku
````
heroku container:release web --app nlw-05-nodejs
````

Comando que irar mostrar a URL do projeto.
````
heroku open --app nlw-05-nodejs
````
</p>
</details>

## Primeiro acesso 

Indo para rota criada em ````http://localhost:8080/````
iremos depara com 
````Unlock Jenkins````
<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/1_unlock_jenkins.png" width="450" />

Aqui está pedindo uma senha para o primeiro acesso da plataforma utilizando o comando  ````docker exec -it <nome do container> cat /var/jenkins_home/secrets/initialAdminPassword````
ou 
````docker exec -it jenkins cat /var/jenkins_home/secrets/initialAdminPassword````
ele irar retornar a senha que foi gerado.

Na tela de Customize Jenkins iremos instalar plug-ins recomendado pela comunidade.

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/3_getting_started.png" width="450" />

Logo em seguida teremos essa tela, pode demorar um pouco ...

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/4_getting_started.png" width="450" />

Ao finaliza a instalação dos plug-ins irar pedir para criar login de acesso.

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/7_getting_started_create_first_admin_user.png" width="450" />


Ao criar o cadastro perguntar sobre criação da instancia aqui é só prosseguir em ````Save````.

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/7_getting_started.png" width="450" />

Proxima tela é só ````Start do jenkins````.

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/8_getting_started.png" width="450" />


Na home do painel do Jenkins selecione ````Novo Job```` adicione o nome do seu projeto e selecione ````Construir um projeto de software free-style````.

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/9_home.png" width="350" />  
<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/10_create_new_project.png" width="350" />


Ativando nodeJs ser não já estiver ativo, precisamos configurar em ````Gerenciar o Jenkins```` >  ````Global Tool Configuration```` em nome adicione o ````node```` e ````save````.

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/add_nodejs_av_global.png" width="350" />

Criando um Build de Implantação Contínua. Iremos adicionar o ````titulo```` do projeto, o ````máximo de builder```` para manter coloquei como 2(caso tenha vários  não fique uma lista gigantesca), selecione ````Github Project```` 

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/11_general.png" width="350" />

Adicionar novo credenciais, iremos adicionar as credenciais do GitHub, para que o Jenkins possa fazer o merger e dar o push, em  ````http://localhost:8080/credentials/store/system/domain/_/````
em adicionar credencias.

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/12_add_credentials.png" width="350" />

OBS:: PODE TROCAR O EMAIL PELO USERNAME DO GITHUB.

Selecione ````GIT```` adicione a URL do seu repository, selecionar as credencias de acesso do github, a branches que irar ficar monitorando, no meu casos deixarei como ````*/develop*````

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/13_genrenciamento.png" width="350" />


Em trigger selecione ````GitHub hook````.

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/14_trigger.png" width="350" />


Em Ambiente de build selecione ````Add Timestamps```` e ````Provide Node & npm````.

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/15_build.png" width="350" />


Em ````Build```` como estou usando 100% docker e já faço os teste direto no 
container, aqui pode desconsiderar, pode causar erro por não encontra o projeto na rais os comandos 

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/16_build_script.png" width="350" />


Em ````Assoes pós Builder```` iremos selecionar ````Git Publish```` com os campos 
````Publish Only ````, ````Merge Result```` e ````Force Push````.
Em ````Branch to Push```` é a branch que iremos merge com a dev e 
````Target Remote```` o origin.

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/17_build_script.png" width="350" />

Agora iremos criar o PIPE-LINE indo pra ````HOME```` e selecionando ````Novo Job```` 
der ao nome o projeto e selecione  ````Pipeline````.

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/18_create_pipe.png" width="350" />


Em ````General```` adicione uma descrição e selecione ````GitHub Project```` adicionando a url do projeto.

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/19_create_pipe.png" width="350" />


Em ````Builder Triggers```` selecione ````Construir após a construção de outros projetos```` e selecione
um projeto.


<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/20_create_pipe.png" width="350" />

## Ao configurar poderar monitorar todo o seu projeto.

#### Start

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/start_pipe.png" width="350" />

#### Sucesso

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/start_pipe_sucesso.png" width="350" />


#### CI/CD Sucesso

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/piple_completo.png" width="350" />


Em pipe line adicione o seu ````jenkinsfile```` exemplos de arquivos
[nlw-04-nodejs](https://github.com/FranciscoWallison/nlw-04-nodejs/blob/master/jenkins/jenkinsfile),
[nlw-05-nodejs](https://github.com/FranciscoWallison/nlw-05-nodejs/blob/master/jenkins/jenkinsfile)
#### Leia a doc
[documentação](https://www.jenkins.io/doc/).
