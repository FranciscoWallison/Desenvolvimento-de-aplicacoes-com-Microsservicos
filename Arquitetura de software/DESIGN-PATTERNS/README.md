## O que é Design Patterns
- Soluções comuns para diversos tipos de problemas

## N-Tier / N-Layer Architecture
- Arquitetura baseada em camadas
- Exemplos de camadas: Presentation, Application e Data
    - Presentation
      - Exibição
      - Web: React, SSR
    - Application
      - Regras de Negócios 
      - App: Laravel, Express
    - Data
      - Dados e processamentos e armazenamento informação
      - Banco: Mysql, SQL-Serve

## Multi-tentant Architecture
```` 
    Imagina que tenha dois Clientes aonde tenha que separar sempre as suas informações, conforme a empresa como um sistema SAS.
    Tem 3 formas para separa as informações:
    Banco: cria-se um banco para cada cliente passando a informação do id do cliente.
    Tabela: Tabelas referenciado informações o cliente.
    Consulta: Executando algum tipo 'SELECT', filtrando as empresas/cliente.
````

## Stateless vs Stateful

- Stateless e Stateful reflete a maturidade de uma aplicação.

- Stateless:A diferença mais importante é que o stateless é um widget estático, ou seja, não temos como gerenciar o estado dele.

- Stateful: E o stateful é completamente dinâmico e nos dá o poder de torná-lo mutável através da gerência de estados.


## Serverless
- Desliga o freezer a noite.
- Paga somente o que é usado.
- Não vou pagar por hora mas por uso.

## Microsserviços
- Baixo acoplamento
- Não compartilha banco de dados
- Principal motivação: Organizacional. Equipes.
- Escalabilidade
  - Só escalo um único sistema
- Separação de responsabilidade
- Diferentes tecnologias
  - Ferramentas e tecnologias focado mais ao negocio
-------
- Primeiros passos:
    - Maturidade da organização
    - Maturidade dos times
    - Deployment
    - Observabilidade
      - Saber qual sistema está fazendo o que
    - Troubleshooting
      - Saber de onde vem o erro

## CQRS (Command Query Responsibility Segregation)
- Separar Command Stack e Query Stack
- Com objetivo de separar evento de ação e consulta
- Alternativa CQS
- Separar a leitura e a gravação de dados em áreas distintas em uma aplicação

## Caching 
- Tem como armazenar eventos predefinidos para diminuir o tempo de consumo

## Estratégia de invalidação de cache
- Time-base invalidation
  - Caching vai ter um tempo predeterminado.
- Last Recently Used (LRU)
  - Vai limitar a quantidade de Caching armazenado e remove os cache em formato de fila
  - Os dados que tiveram acesso mais recentemente
- Most Recently Used (MRU)
   - Esta estratégia invalida os itens que foram acessados mais recentemente. Ou seja, se um item no cache foi acessado recentemente, ele será removido da cache primeiro.
- Least Frequently Used (LFU)
   - Remove o que teve menos frequência de acesso
- TTL-based invalidation
   - Ao criar o registro com um tempo ele permanecerá válido (isto é, qual o TTL dele). Após esse tempo ele é invalidado automaticamente.
- Write-through invalidation
   - Para sistema que não tem muita gravação 
   - Sempre quando há alteração no disco, o cache é atualizado.
   - Esse estratégia funciona bem com sistema que não possuem um alto índice de escrita.
- Write-back invalidation
   - Guarda primeiro no cache depois no banco de dados.
   - Quando há alteração, o cache primeiramente é alterado e depois o dado em disco é atualizado. Muitas vezes o dado em disco é atualizado quando o cache já está para expirar de alguma forma.

## Distributed Locking
 - Consistência de dados
 - Contenção de recursos
 - Evita dead locks
 - Garante mais eficiências de recursos
 - Ferramentas: Apache Zookeeper, ETCD, Redis, Consul
 - Garantir a consistência dos dados em um ambiente distribuído

## Configuration 
 - Configurações de uma aplicação mudam a qualquer momento
 - Como mudar uma senha de banco de dados, credenciais de email,
etc... Sem ter que reiniciar totalmente a aplicação ou refazer o deploy?
 
````
 Tem como principal objetivo de não precisar reiniciar, iniciar um novo deploy
ou dar um novo boot na aplicação toda para receber as configurações.
````

## Secret Management

- Credenciais não podem ficar "voando" na empresa
- Processos para rotacional credenciais são importantes
- Serviços gerenciados e soluções ajudam nessa tarefa
    - HashiCorp Vault
    - AWS Secret Manager
      - Armazenamento de secrets 
      - Rotacionamento automáticos de secrets nos serviços como RDS.
      - SDK para recuperação dos secrets em tempo de execução

## Circuit breaker
- Evitar a falha geral do sistema em caso de erros recorrentes
````
Tem como objetivo de administrar falhas em cascatas utilizando como exemplo microservices.
Auxiliando quando acontece um ou mais serviços ficam indisponíveis ou respondem com alta latência.
````

## Sequencing
````
Ele retorna UUI para os sistemas como Microsserviços 
````

## API Gateway
- Centralizador de requisições
- Roteamento
- Autenticação
- Conversão de dados
   - Exemplo: api converte para xml e roteia para o sistema que utiliza.
- Cabeçalhos
- Throttling
- Rate Limit

## Event Drive Architecture
- Evento acontecem no passado
   - Event Notification
     - O Event Notification possui apenas as informações necessárias mudando o estado de um sistema
   - Event Carried State Transfer
     - Possui todos os dados do evento ocorrido
   - Event Sourcing
      - Tem como objetivo de capturar todos os eventos dentro de um banco

- Um evento emitido pode ser o gatilho de entrada para um outro sistema
- Coreografia VS Orquestração 

## Publish-Subscribe

## Backend for Frontend
- Trabalhar somente com dados necessário 

## Sidecars Applications
- Aplicações auxiliares na aplicação principal
- Coleta de logs
- mTLS
- Controle de tráfego
````
Uma aplicação ficar se comunicando com as demais serviços que se utiliza.
Um componente independente que roda em conjunto com a aplicação principal.
````

## Service Mash
- Gerenciamento de tráfego
  - Dados de Log's
    - Um registro de erros do sistema
- Segurança
- Policy enforcement
- Observabilidade
  - A observabilidade ajuda a identificar a causa raiz de problemas no sistema.
  - Rastreamento distribuído (tracing)
    - Rastrear a interação de componentes do sistema em um ambiente distribuído
  - Mecanismo de push e pull para coletar métricas
    - Servidor de coleta, enquanto no mecanismo de pull, o servidor de coleta é responsável por solicitar as métricas do sistema alvo.
  - Métricas e Logs
    - Métricas são informações sobre o desempenho do sistema, enquanto logs são informações sobre a atividade e eventos relevantes em um sistema ou aplicativo.
- Extensibilidade
- Istio
  - O Istio é um sistema de Service Mesh
- Envoy
  - Proxy
````
Uma malha de serviço é uma camada de infraestrutura dedicada que você pode adicionar as suas aplicações. Ele permite adicionar recursos de forma transparente, com observabilidade, gerenciamento de tráfego e segurança, sem adicioná-los ao seus próprio código. 
````

## Pattern ACL (Anti Corruption Layer) 
````
Cria uma camada entre o seu domínio e o domínio de um sistema externo, fazendo a tradução entre domínios, evitando assim a corrupção entre os sistemas.
````
