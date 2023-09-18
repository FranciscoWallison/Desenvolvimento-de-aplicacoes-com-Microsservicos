### Dependency Inversion Principle - DIP 
````
“Abstrações não devem depender de detalhes. Detalhes devem depender de abstrações”.
Dependência (Dependency Inversion Principle - DIP), que faz parte dos princípios SOLID.
O DIP afirma que os módulos de alto nível não devem depender dos módulos de baixo nível,
ambos devem depender de abstrações
````

####  SRP - Single Responsability Principle
````
"Uma classe ou módulo tem apenas um único motivo para mudar;" - 
    O SRP afirma que uma classe deve ter apenas uma única razão ou motivo
    para mudar. Isso significa que uma classe deve ter uma única responsabilidade bem
    definida, e se houver mais de uma razão para fazer alterações nessa classe, ela
    deve ser dividida em classes menores, cada uma com uma única responsabilidade.


"Uma classe ou módulo deve, obrigatoriamente, ter uma única responsabilidade;" - 
    O SRP enfatiza que uma classe deve ter uma única responsabilidade, o que significa
    que deve haver coesão entre os membros da classe em torno de uma única tarefa ou função.

````

#### Service Layer
````
"É uma camada intermediária entre a camada de apresentação e acesso a dados;" - 
    A Service Layer é uma camada intermediária que atua como um 
    intermediário entre a camada de apresentação (interface do usuário) e a camada de acesso a 
    dados (geralmente composta por repositórios ou serviços de acesso a banco de dados). 
    Ela é responsável por receber solicitações da camada de apresentação, processá-las e 
    coordenar a execução da lógica de negócios, que pode envolver acesso a dados.

"Encapsula a lógica de negócio;" - 
    Uma das principais responsabilidades da Service Layer é encapsular a lógica de negócios da aplicação.
    Isso significa que as regras de negócios específicas da aplicação são implementadas nas
    classes da Service Layer, garantindo que a lógica de negócios seja separada da camada de
    apresentação e da camada de acesso a dados.

"Gerencia transações;" -
    Embora seja comum que a Service Layer gerencie transações em um aplicativo, essa não é
    uma responsabilidade estritamente associada a todas as Service Layers. O gerenciamento de
    transações pode depender do contexto e das necessidades específicas do aplicativo. Em alguns
    casos, o gerenciamento de transações pode ser feito em um nível mais baixo, na camada de acesso a dados.
````

#### Hexagonal Architecture
````
    Primary Actor / Drivers é tudo que utiliza os casos de uso de uma aplicação.
````

#### LSP (Liskov Substitution Principle)
````
    O LSP exige que as subclasse sejam substituíveis por suas classes base sem alterar o comportamento esperado.
````

#### Princípio da Inversão de Dependência (Dependency Inversion Principle - DIP)
````
    Separe o comportamento extensível por trás de uma interface e inverta as dependências.
````