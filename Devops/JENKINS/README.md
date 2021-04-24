


## Criando docker-compose
Crie um arquivo chamado ````docker-compose.yml````

Com as configurações da imagem e container
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
Rode o comando: 
````
docker-compose -f docker-compose.sonar.yml up -d
````

Ao finalizar o build ele irar criar uma rota em ````http://localhost:8080/````.

Antes de iniciar começar as configurações do Jenkins, vamos iniciar o hook do GiHut.
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

OBS:: Pode esta utilizando outras alternativas, mas precisamos que a aplicação do Jenkins estejá apontando em um HTTPS publico, lembrando de sempre por arrota ````SUA_URL/github-webhook/```` dando como o exemplo ````https://fuzzy-deer-73.loca.lt/github-webhook/````

________________________________
Precisamos fazer o login no heroku para que o Jenkins possa ter acesso e fazer o deploy. Com o comando ````docker exec -it jenkins bash````
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

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/9_home.png" width="350" />   <img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/10_create_new_project.png" width="350" />



Ativando nodeJs ser não já estiver ativo, precisamos configurar em ````Gerenciar o Jenkins```` >  ````Global Tool Configuration```` 

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/add_nodejs_av_global.png" width="350" />



Criando um Build de Implantação Contínua

Adicionar novo credenciais, iremos adicionar as credenciais do Heroku ````http://localhost:8080/credentials/store/system/domain/_/````
em adicionar credencias.

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/JENKINS/imgs/11_general.png" width="350" />




