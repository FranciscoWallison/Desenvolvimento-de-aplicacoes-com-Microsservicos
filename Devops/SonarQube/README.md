## Introcução
````
SonarQube é uma ferramenta para garantir a qualidade do projeto, utilizando formas de revisar codigos.
````

## Objetivo
````
- Trechos de código fonte que possam gerar bugs
- Duplicidade de linhas de comando
- Prevenindo a repetição de instruções desnecessárias
- Segurança
````

# Um mini tutorial para usar com o NodeJS e Docker.
- O projeto utilizado fui desenvolvido durante a 5 NLW da rocketseat.

Dependências Necessárias (Com o ````jest```` já instalado no seu projeto)
````
yarn add -D sonarqube-scanner 
yarn add -D jest-sonar-reporter
yarn add -D supertest
````

Configurações do ````package.json```` adicionar esses linhas 
````
  ...
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": [
      "/node_modules/"
    ],
    "testResultsProcessor": "jest-sonar-reporter"
  },
  "jestSonar": {
    "reportPath": "coverage",
    "reportFile": "test-reporter.xml",
    "indent": 4
  }
  ...
````

Ainda em ````package.json```` adicionar essas linhas em ````"scripts":````. (Caso já utilize desconsidere)
````
"scripts": {
  ...
      "test": "NODE_ENV=test jest -i --detectOpenHandles",
      "test:coverage": "NODE_ENV=test jest -i --coverage",
      "sonar": "node sonar-project.js"
  ...
},
````

Ao gerar o arquivo ````jest.config.js```` modificar a linda ou adicionar.
````
  ...
      testResultsProcessor: "jest-sonar-reporter",
  ...
````

Com essas configurações em projeto já podermos esperar resultado, com a analise o ````testExecutions```` que o SonarQube necessita.

Rode o comando: 
````
yarn test:coverage
````
Ao finalizar irar gerar uma pasta na raiz com o nome ````coverage````.

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/SonarQube/fotos/test-reporte.png" width="250" />

## Criando docker-compose
Crie um arquivo chamado ````docker-compose.yml````

Com as configurações da imagem para container
````
version: '3' # vs mais atual
services:         
  sonarqube:
    container_name: sonarqube
    image:  sonarqube:latest
    ports:
      -  "9000:9000"
      -  "9092:9092"

````
Rode o comando: 
````
docker-compose -f docker-compose.sonar.yml up -d
````
Até aqui esperasse que na maquina seja criada a o acesso ````http://localhost:9000/````.

Pedira a senha e logo depois criar uma nova senha.

O Login e Senha de primeiro acesso é:
````
Login: admin
Password: admin
````

 Na raiz do seu projeto cria uma arquivos com nome de ````sonar-project.js````, com as seguinte configurações.
````
const sonarqubeScanner =  require('sonarqube-scanner');
sonarqubeScanner(
    {
        serverUrl:  'http://sonarqube:9000',
        options : {
            'sonar.projectKey': 'nlw-05-nodejs',
            'sonar.sources':  'src',
            'sonar.tests':  '__tests__',
            'sonar.inclusions'  :  '**/src/**', // Entry point of your code
            'sonar.exclusions'  :  '**/node_modules/**,**public**', // Entry point of your code
            'sonar.test.inclusions':  '__tests__/**/*.spec.js,__tests__/**/*.spec.jsx,__tests__/**/*.test.js,__tests__/**/*.test.ts',
            'sonar.javascript.lcov.reportPaths':  'coverage/lcov.info',
            'sonar.testExecutionReportPaths':  'coverage/test-reporter.xml',
            'sonar.login':'admin',
            'sonar.password':'admin'
        }
    }, () => {});
````
-----
Nas linhas 
````'sonar.login':'admin',```` e ````'sonar.password':'admin'```` 
os dados de login que redefinimos no sonar.

-----
Na linha 
````'sonar.projectKey': 'nlw-05-nodejs',```` é  a ````Project key```` 
que iremos configurar na plataforma do SonarQube.


#### Todas as informações passadas podem ser encontradas na [DOC](https://docs.sonarqube.org/latest/analysis/analysis-parameters/)


Voltando para a ````HOME```` SonarQube logo de cara irar ver um botão com ````Create new project````

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/SonarQube/fotos/sonar_home.png" width="350" />

Criando um novo projeto estarei utilizando ````Manually````

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/SonarQube/fotos/create_new_project.png" width="350" />

No campo ````Project key```` estarei utilizando o nome como EXEMPLO ````nlw-05-nodejs```` e ````Set Up````.

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/SonarQube/fotos/project_key.png" width="350" />

Finalizando aqui espera-se essa tela, que é a de dashboard.

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/SonarQube/fotos/project_key.png" width="350" />

Feito tudo isso, esperasse que já tenha dado o comando  ````yarn test:coverage```` para poder gerar a pasta ````./coverage````, já podemos rodar o comando ````yarn sonar```` esperando no fim do builder um ````Analysis finished.````.

Após ter finalizado espera-se que no dashboard da plataforma criada mostre os dados do projeto ````http://sonarqube:9000/dashboard?id=nlw-05-nodejs````

<img src="https://github.com/FranciscoWallison/Desenvolvimento-de-aplicacoes-com-Microsservicos/blob/master/Devops/SonarQube/fotos/sonar_dashboard.png" width="350" />


# Algumas referências
https://www.sonarqube.org/

https://hub.docker.com/_/sonarqube

https://jestjs.io/pt-BR/

https://medium.com/swlh/nodejs-code-evaluation-using-jest-sonarqube-and-docker-f6b41b2c319d
