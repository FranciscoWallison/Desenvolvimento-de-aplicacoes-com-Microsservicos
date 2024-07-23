


#### Principais camadas de Clean Architecture
````
    Adapters, Use Cases, Gateways

Adapters:
    Esta camada contém as interfaces que conectam o sistema a elementos externos, como frameworks,
    banco de dados, UI, etc.

Use Cases:
    Esta camada contém a lógica de negócios da aplicação, implementando os casos de uso específicos do domínio.

Gateways:
    Esta camada contém interfaces para acesso a recursos externos, como armazenamento de dados,
    serviços web, etc. Ela permite que esses recursos sejam trocados ou substituídos sem afetar a
    lógica de negócios da aplicação.

````

#### Active Record e Data Mapper
````
"Active Record carrega dados e comportamento, ou seja, existe um alto acoplamento;" -

    O Active Record é um padrão de design em que uma classe (ou objeto) representa um registro
    em um banco de dados e, portanto, carrega tanto os dados quanto o comportamento associado a
    esse registro. Isso resulta em um alto acoplamento entre a classe e o banco de dados.

"Active Record carrega dados e comportamento, ou seja, existe um alto acoplamento." -

    No padrão Active Record, os objetos incorporam tanto os dados quanto o comportamento que manipula esses dados. Isso geralmente leva a um alto acoplamento entre a lógica de negócios e a persistência de dados, pois o objeto de domínio também é responsável por gerenciar a própria persistência.


"Data Mapper proporciona separação de conceitos (SoC) pois irá separar entidades (objetos de mapeamento) do modelo de domínio."

     O padrão Data Mapper separa os objetos do domínio (que contêm a lógica de negócios) da lógica de persistência. Isso é feito por meio de um "mapper" que move dados entre objetos e um banco de dados de maneira que os objetos de domínio não precisem ter conhecimento de como eles são persistidos, promovendo uma clara separação de conceitos.


"Data Mapper permite o uso de domínios não anêmicos com maior facilidade"

    O padrão Data Mapper é mais adequado para criar modelos de domínio ricos (não anêmicos), onde a lógica de negócios é encapsulada dentro dos objetos de domínio, sem misturar com a lógica de acesso a dados. Isso facilita a manutenção e evolução do modelo de domínio.

"Data Mapper proporciona separação de conceitos (SoC) pois irá separar entidades (objetos de mapeamento) do modelo de domínio;" - 

    O Data Mapper é um padrão de design que separa as entidades do modelo de domínio (objetos de negócio)
    dos objetos de mapeamento que são responsáveis por mapear os dados entre as entidades e o banco de dados.
    Isso promove a separação de conceitos (Separation of Concerns - SoC) e ajuda a reduzir o acoplamento entre o
    domínio e a camada de persistência.

"Data Mapper permite o uso de domínios não anêmicos com maior facilidade;" - 

    O Data Mapper é mais adequado para lidar com domínios não anêmicos, ou seja, domínios em que as
    entidades possuem comportamento significativo além das simples propriedades de dados. Isso ocorre
    porque o Data Mapper separa as entidades do modelo de domínio, permitindo que essas entidades
    contenham comportamento rico sem estar diretamente ligadas à camada de persistência.
````

####  Adapters na Hexagonal Architecture
````
    Adapters gerenciam as Portas, implementando tudo que é necessário para a saída do hexágono
    (núcleo da aplicação) para o mundo real.
````

####  “Regra de Ouro” - 3 Layers Architecture 
````
A camada de domínio e a camada de DataSource nunca podem depender da apresentação.


"Regra de Ouro" na arquitetura de três camadas (3 Layers Architecture).
Ela estabelece que a camada de domínio, que contém a lógica de negócios, e a camada de DataSource,
que lida com o acesso a dados, nunca devem depender da camada de apresentação.

````