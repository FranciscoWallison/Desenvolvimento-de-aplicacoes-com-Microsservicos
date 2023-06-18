# System Design: Importância

- System design é o processo de definição de arquitetura, componentes, módulos, interfaces e dados para atender os requisitos especificados.

- Pensar na arquitetura de forma intencional
- Racionaliza as definições que realmente importam
- Explorar possíveis soluções
- Nos ajuda a ter uma visão de presente e futuro do software
- Exercita a forma de pensar e planejar diferentes tipos de soluções de software
- É importante realizar o design usando a abordagem de middle-out, buscando o cerne da arquitetura,
considerando o tempo, dinheiro e pessoas disponíveis.

#### Premissas de System Design
- Ter qualidade de experiência para o usuário; em grande escala, tudo vai falhar; não armazenar nada desnecessário.

## System Design VS Big Techs

- Normalmente faz parte da maioria dos processos seletivos de Big Techs
- Formas do candidato pensar
- Repertório eo nível do profundidade nas tecnologias
- Capacidade de dedução
- Capacidade de comunicação
- Capacidade de ser confrontado

# System Design no Mundo Real

- System design é uma ferramenta na mão do arquiteto de solução
- É um forma do arquiteto se expressar
- Gerar convicção
- Vender
- Especificar e documentar

```
Basta fazer desenhos da arquitetura?
NÃO!!
```

# Técnica e metodologia
- 6 Elementos
  - Requisitos 
  - Estimativa de capacidade
  - Modelagem de dados
  - API Design
  - System Design
  - Exploração (confronto, analisar, justificar a sua criação)


___________________________________________________________________________________

# Requisitos

- Core Features e domínio
   - Entendimento do domínio da aplicação e suas principais funcionalidades

- Support features
   - Funcionalidades que auxiliares que farão com que as funcionalidades principais sejam atendidas

- Premissas estabelecidas no caso apresentado
    Aceitar apenas cartão de crédito, com confirmação imediata, focando em
consistência em relação à alta disponibilidade e gerar o ingresso com
um código curto e não-sequencial.

- Pontos críticos do sistema
    Instabilidade da gateway, geração de código do ingresso, geração do QRCode,
envio de email de confirmação.

- Para a criação de códigos dos ingressos e do QRCode:
    Separar as criações de código e QRCode do serviço de compra de ingressos melhora o desempenho do último.


# Na prática

````
Requisitos dos sistema

Requisitos funcionais
    Funcionalidades Core
       - Compra de ingressos
       - Apresentar o ingresso comprado
       - Parceiros para gerenciar os eventos

    Funcionalidades de suporte
        - Busca dos eventos 
        - Exibição gráficas dos lugares disponíveis 
        - Comprar de ingressos
        - Apresentar o ingresso comprado para entrar no evento
        - Parceiros para gerenciar os eventos
        - Garantia que em horários de picos, um ingresso não seja vendido para mais de um pessoa

Requisitos não funcionais
    Características
        - Baixa latência
        - Escalável
        - Alta disponibilidade
        - Consistência dos dados
    Dados Importantes
        - 1M DAU (Daily Active Users)
        - Cada usuários faz 5 requeste
        - Cada request resulta em 50KB
        - 5% dos usuários compra 1 ingresso
        - Reads VS writes: 9:1
        - Pode ter picos de acesso

Requisitos de Sistema
    Notação Científica
        - 1.000     = 10^3
        - 10.000    = 10^4
        - 100.000   = 10^5
        - 1000.000  = 10^6
        - Multiplicação
          - 10^5 * 10^3 = 10^(5+3) = 10^8
        - Divisão
          - 10^5 / 10^3 = 10^(5-3) = 10^2 
        Ex:
            - 7.000     = 7*10^4
            - 95.000    = 95*10^3 ou 9.5*10^4
            - 10^(-1)   = 0.1
        -
            MB para GB = 10^3
            GB para TB = 10^3
            MB para TB = 10^6
    Requeste
        Qual é a capacidade de requests?
        - 10 rps
        rps (Requisições por segundos)
        Ex: 
            rps = req por dia / segundos por dia
            segundos por dia = 24H* 60 * 60 segundos = 86.400 segundos

            Arredondando: 1 dia = 100.000 segundos ou 10^5 

        - 1.000,000 * 5 = 5.000,000 por dia
        - 5000,000 / 100.000 = 50 rps
        ou 
        - 5*10^6 / 10^5 = 5*10^(6-5)
          -> 5*10^1 = 50rps
        
        Writes:
        - 50 rps / 10 = 5 rps
        Reads:
        - 45 rps

        Compras
            - 5% de 1Mi = 50.000 por dia
            - 5% de 10^6 = 5*10^4

            - 5*10^4 / 10^5 (qtd de segundos)
            -> 5*10^(4-5) = 5*10^(-1) 
            -> 0.5 compras por segundos
    Bandwidth
        Qual o bandwidth necessário?
            - 0.2 MB/s
        - 50rps * 50kb = 2500kb/s
        ou
            2.5/1000 = 2.5MB/s
        ou
            2.5*10^3 / 10^3 = 2.5*10^(3-3) = 2.5MB/s 

    Storage
        Storage por segundo:
            - 0.06 MB
        Storage por dia:
            - 6 GB
        Storage por ano:
            - 2.19 TB
        Storage em 5 ano:
            - 12 TB
        writes per sec * request size
        - 5rps * 50KB * 3
          -> 250KB * 3 = 750KB/s = 0.75MB/s

        Storage por dia:
            storage por sec * 10^5 (1 dia -> 100K segundos)
        Storage por ano:
            storage por sec * 10^5 * 3.65^2 = 3.65*10^7
        Storage por 5 anos:
            storage por sec * 3.65*10^6 * 5 = 18.25*10^7
              -> 1.8*10^8 -> 2*10^8

        Storage por dia:
            - 0.75MB/s * 10^5 = 0.75*10^5MB
              -> 0.75*10^5 / 10^3 = 0.75*10^2 = 75GB
        Storage por ano:
            - 0.75MB/s * 3.65*10^7 = 2.7*10^7MB
              -> 2.7*10^7 / 10^6 = 2.7*10^1 = 27TB
        Storage por 5 anos:
            - 0.75MB/s * 2.7*10^8 = 1.5*10^8MB
              -> 7.5*10^8 / 10^6 = 1.5*10^2  = 150TB

Premissas
Compra de ingressos e apresentação de QRCODE.
- Aceitar apenas cartão de crédito
- Compra precisa ser confirmada imediatamente
- Consistência ao invés de alta disponibilidade no PROCESSO DE COMPRA
- Concorrência
- Código do ingresso não é sequencial nas precisa ser CURTO.

Opção 1:
    - Usario 1: 
    - Usario 2:
    - Usario 3:
        - Compra de ingressos (1)
            - Verificar a disponibilidade
            - Gerar ordem de serviço
            - Envio a request gateway
        - Gateway de ACL (2)
            Gateway de pagamento (2.1):
            Gateway de pagamento (2.2):
            Gateway de pagamento (2.3):
                - Dar baixa na ordem 
                - Gerar código único de ingresso
                - Gera o QRCode
                - Envio email de confirmação
        - Email service (3)
            - Email queue 
            - Recebe a mensagem de (1), deforma assíncrono
        - Gerador de códigos de QRCode (4)
            - Pode ser um Design Patterns de Sequencing
            - É chamado pelo sistema (1) para associar ao ingresso
                - Gera um Storage com as informações do ingresso/QRCode
    - Ponto único de falha (fora do nosso controle)
        - Instabilidade na gateway
    - Pontos de possível lentidão:
        - Geração de código do ingresso
        - Geração do QRCode
        - Envio de email de confirmação
    - Efetua o pagamento
    - Informa compra aprovada

Data Model
    Relacional Database
    Compra de Ingressos
        tabelas
            client      - id, nome, email 
                has many    ()
            order       - id, client id, total, ticket id 
                            ()  has many
            event       - id, nome, data,  qtd de spots
                            ()  belong
            event spots - id, event id, spot number

    Relacional Database
    Gerador de código e QRCode
        tabelas 
            ticket      - ticket id, assigned (0 - 1), order id

   Key-value Store
    Email service
        tabelas
            email       - order Id, sent (0-1)

````    
#### Resumo


### API Design
Comprar ingresso
    placeOrder(userId, eventID, spotID)
    response:
        - OrderID
        - TicketID

Visualizar ingresso
    viewTicket(ticketID)
    response:
        - OrderID
        - UserID
        - User Name
        - Event Name
        - Event Data
        - Spot
        - Total

###  Serverless
- Processamento das requisições na compra de ingressos iremos utilizar - AWS Serverless

- A Lentidão no disparo de emails é manter o email service no mesmo microsserviço de compra de ingressos, 
tem separar os serviços e mantendo-o síncrono.

- Pontos críticos para métricas e monitoramento: Orders por segundo, latência e disponibilidade das
gateways de pagamento e compras aprovadas vs rejeitadas.

````
AWS:
    - Usario 1: 
    - Usario 2:
    - Usario 2:
        API Gateway
            Place Order Y
                - DB: Order
            Comunica com:
                - GetTicketID Y
                   -  DB: TicketsID
                        - Generate TicketsID (uma CRON)
                            - QRCode (bucket)
                - Make Payment Y
                - Email Topic
                    - Send Email
                        - DB: Email

            Get Ticket Y
                Comunica com:
                    - QRCode (bucket)

````

# Métrica de Monitoramento
- Order por segundo
- Latência e disponibilidade das gateways de pagamento
- Compras aprovadas VS rejeitadas
- Compras VS Emails enviados
- Tickets exibidos / Latência
- ID's Disponíveis 

## Perguntas Provocativas
- A aplicação realmente está escalável?
- Aplicação é resiliente?
- Onde está o maior risco dessa arquitetura?

### Teorema CAP
- Consistência ( Consistency )
- Disponibilidade ( Availability )
- Tolerância de partição ( Partition Tolerance )
````
Só pode escolher dois CA, CP e AP

É impossível obter simultaneamente mais de duas das três garantias.
````


#### Dicas
````
    Armazenar dados tem um custo baixo, mas a consulta tende a ter um custo maior porque o
data transfer out precisa ter um baixo tempo de resposta. 

    As estimativas dos recursos necessários para o desenvolvimento de um sistema não precisam ser precisos.
Porem, quanto mais proximo da realidade evita-se aumentos de custo e tempo durante o desenvolvimento do projeto.

O aumento da consistência e da disponibilidade implica num aumento de custo. 

O Critical User Journey (CUJ) são as interações mais importantes entre o usuário e o produto.

Com relação à modelagem de dados, é importante incluir tanto banco de dados SQL e no-SQL para
demonstrar o domínio sobre este tema ao entrevistador.

A probabilidade de passar por uma entrevista de System Design é maior quando:
A vaga é para desenvolvedor senior ou níveis maiores e a empresa tem maior porte.

Dentre os principais pontos que poderão ser abordados na entrevista de System Design, algumas delas são:
Requerimentos do sistema, estimativa de capacidade, modelagem de dados e api design.

Algumas das estratégias para melhor responder ao entrevistador é:
Explicar o link entre os endpoints da API e as chamadas do banco de dados.
Usar números fáceis para calcular a escala do sistema e explicar estes números.
Incluir a estimativa de capacidade de armazenamento de dados.

O entrevistador pode pedir para realizar o System Design de diversos tipos de sistemas,
sejam genéricos ou realísticos.
````
