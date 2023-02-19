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

- Aplicação que sobe ou é removido sem preder um dados.

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

## Caching 
- Tem como armazenar eventos predefinidos para diminuir o tempo de consumo

## Estratégia de invalidação de cache
- Time-base invalidation
  - Caching vai ter um tempo predeterminado.
- Last Recently Used (LRU)
  - Vai limitar a quantidade de Caching armazenado e remove os cache em formato de fila
- Most Recently Used (MRU)
   - 
- Least Frequently Used (LFU)
   - Remove o que teve menos frequência de acesso
- TTL-based invalidation
- Write-through invalidation
   - Para sistema que não tem muita gravação 
   - Sempre quando há alteração no disco, o cache é atualizado.
   - Esse estratégia funciona bem com sistema que não possuem um alto índice de escrita.
- Write-back invalidation
   - Guarda primeiro no cache depois no banco de dados.
   - Quando há alteração, o cache primeiramente é alterado e depois o dado em disco é atualizado. Muitas vezes o dado em disco é atualizado quando o cache já está para expirar de alguma forma. 