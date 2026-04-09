# O que é cloud

   A computação em nuvem é a entrega sob demanda de poder
computacional, armazenamento de banco de dados,
aplicações e outros recursos de TI por meio de uma
plataforma de serviços de nuvem via Internet com uma
definição de preço conforme o uso. ````pay-as-you-go````

````Referência:```` AWS (Amazon Web Services) 
______

# Vantagens

º Baixo investimento inicial em hardware

º Menos tempo para gerenciamento de hardware

º Provisionamento de recursos

º Elasticidade: aumento ou redução da 
capacidade de 
infraestrutura a depender de demanda


## Arquitetura de Solução para Cloud
- [AWS Well-Architected](https://aws.amazon.com/pt/architecture/well-architected/?wa-lens-whitepapers.sort-by=item.additionalFields.sortDate&wa-lens-whitepapers.sort-order=desc&wa-guidance-whitepapers.sort-by=item.additionalFields.sortDate&wa-guidance-whitepapers.sort-order=desc)
- Frameworks de boas práticas
  - Excelências Operacional
  - Segurança
  - Confiabilidade
  - Eficiência e performance
  - Otimização de custos
  - Sustentabilidade

- Os 6 pilares do AWS Well-Architected são:
````
Excelência operacional, Segurança, Confiabilidade, Eficiência e performance, Otimização de custos, sustentabilidade.
````

# São princípios que envolvem AWS Well-Architected:

Excelência operacional, Segurança, Confiabilidade, Eficiência de performance, Otimização de custos, Sustentabilidade.


- Use várias zonas de disponibilidade para garantir alta disponibilidade e tolerância a falhas
- Ele fornece uma abordagem padronizada para avaliar cargas de trabalho para melhores práticas

## Excelência Operacional
- Princípios
  - Execute operação como código (IaC)
  - Faço mudanças frequentes, pequenas e reversíveis
  - Refine os procedimentos de operações com frequência
  - Antecipe falhas
  - Aprenda como todas as falhas operacionais
  - Focar na execução e gerenciamento de sistemas para agregar valor aos negócios
````
   A capacidade de oferecer suporte ao desenvolvimento e executar cargas de trabalho com eficiências, obter informações sobre suas operações e melhorar continuamente os processos e procedimentos de suporte para agregar valor aos negócios. 
````

## Eficiência e Desempenho
- Focar no uso eficiente de recursos para atender aos requisitos de carga de trabalho 

## Segurança
- O pilar de segurança descreve como aproveitar as vantagens das tecnologias de nuvem para proteger dados, sistemas e ativos de uma forma que possa melhorar sua postura de segurança.
- Princípios
  - Implemente uma base de "identity" forte
  - Rastreabilidade
  - Ative todos os layers de segurança
  - Proteja os dados em trânsito e os armazenados
  - Mantenha pessoas longe dos dados
  - Prepare-se para eventos de segurança

## Confiabilidade
- O pilar de confiabilidade abrange a capacidade de uma carga de trabalho de executar sua função pretendida de forma correta e consistente quando é esperado. Isso inclui a capacidade de operar e testar a carga de trabalho durante todo o seu ciclo de vida.

- Garantir que os sistemas possam se recuperar automaticamente de falhas
- Princípios
  - Recupere-se automaticamente de falhas
  - Teste procedimentos de recuperação
  - Escale horizontalmente para aumentar a disponibilidade de carga de trabalho agregado
  - Pare de adivinhar a capacidade
  - Gerencie a mudança de forma automatizada

## Eficiência e performance
- A capacidade de usar recursos de computação com eficiência para atender aos requisitos do sistema e manter essa eficiências à medida que a demanda muda e as tecnologias evoluem.
- Ferramenta certa para trabalho certo
- Eficiência 
  - Fazer mais com menos


- Democratizar tecnologia avançadas
- Torne-se global em minutos 
- Use arquitetura serverless
- Experimente como mais frequência
- "Consider mechanical sympathy" 

## Otimização de custos 
- A capacidade de executar sistemas para fornecer valor de negócios ao preço mais baixo.
- Princípios
  - Implemente o Cloud Finance Management
  - Adote um modelo de consumo
  - Meça a eficiência geral
  - Pare de gastos dinheiro em trabalhos que não gerem diférencias compeitivos
  - Analise e atribua despesas
  - Saber o valor de custo e retorno

## Sustentabilidade
- A capacidade de melhorar continuamente os impactos da sustentabilidade, reduzindo o consumo de energia e aumentando a eficiência em todos os componentes de uma carga de trabalho, maximizando os benefícios dos recursos provisionados e minimizando total de recursos necessários.
- Princípios
  - Entenda seu impacto
  - Estabeleça metas de sustentabilidade
  - Maximizar a utilização
  - Antecipe e adote novos ofertas de hardware e software mais eficientes
  - Use serviços gerenciados

## Princípios
- Pare de adivinhar suas necessidades de capacidade
- Sistemas de teste em escala de produção
- Automatize a experimentação arquitetônica
- Permitir arquitetura evolutivas
- Guie sua arquitetura usando dados
- Atualização continua

## Princípios para aplicações Azure
- Design for self healing
- Deixar as coisas redundantes
- Minimize a coordenação
- Desenhe para escalar
- Particionamento
- Design for Operations
- Use serviços gerenciados
- Use melhor data storage para melhor trabalho
- Design for evolution

## Arquitetura de Solução
- Arquitetura focada no Negócio (Nível 0)
- Arquitetura focada na área técnica (Nível 1)
- Arquitetura focada no deployment (Nível 2)

## Modelo On-Premise

### On-Premise - Um ambiente de computação local onde os recursos são gerenciados internamente pela organização.

- Softwares são instalado localmente na empresa ou em um datacenter
- Custo inicial é alto
- Hardware possui depreciação
- Hardware exige manutenção
- Precisa de profissionais qualificados em hardware, rede, software,
 virtualização, etc.
- Escalabilidade complexa
- Alta disponibilidade complexa (rodar em datacenters, fisicamente distantes, ao mesmo tempo)
- Alto controle sobre software, hardware, protocolos de segurança, etc.
- Altamente customizável
- Acesso físico por profissionais da empresa
- Hardware normalmente é mais barato e poderoso do que máquinas padrão que rodam na cloud
- Controle dos dados
- Integração com sistemas legados
- Compliance e regulações (Armazenamento, PCI DSS, HIPPA, (Health Care))
- Custos previsíveis
- Sem lock-in
- Se bem dimensionado, o custo inicial se paga ao longo dos anos
- Ao longo prazo, se bem dimensionado, o custo pode ser menor do que soluções em Cloud
- Desvantagens
  - Maior custo inicial para adquirir e implantar os recursos de infraestrutura.

## Modelo Cloud Computing
- Custo alto ao longo do tempo para determinados serviços
- Alto custo para transferência de dados
- Previsibilidade de custos mais complexa
- Vendor lock-in
- Riscos adicionais de segurança*
- Controle limitado para fazer upgrades
- Compliance*
- Integração pode ser mais complexa com sistema legados
- Baixo custo inicial
- Escalabilidade de forma simplificada
- Acessibilidade
- Alta disponibilidade (Regions e AZs)
- Custo com profissionais especializados em datacenter, rede, hardware, etc
- "Pay-as-you-go": Pague conforme o uso
- Hardware exige manutenção
- Backups automatizados
- Serviços gerenciados
- Recuperação rápida em casos de desastres
- Amplitude de serviços
- Pública
  - Um ambiente de computação em nuvem que utiliza recursos exclusivamente de um provedor de serviços em nuvem.

## Modelo Cloud Híbrido
- Pode ser considerado um modelo de transição
- Modelo alternativo para ter mais controle de dados específicos, porém com as vantagens de nuvem
- Redução de custos para grande utilizações sazonal
- Integração de serviços pode complexa

## Soluções Cloud Native
- Soluções desenhadas para rodar em ambientes de Cloud Computing
- São desenhados tira vantagem desses ambientes
- Modulares
- Prontas para rodar de forma distribuída
- EX: 
    - Docker
    - Kubernetes, Helm, Istio, Linkerd, Envoy
    - Apache kafka
    - Prometheus
      - Um sistema de monitoramento e alerta de métricas.
    - OpenTelemetry
      - Padronizar a coleta de dados de telemetria em ambientes distribuídos.
    - AWS Lambda
    - ArgoCD
    - Produtos HashinCorp (Vault, Consul, Terraform)

## CNCF (Cloud native Computing Foundation)
````
  We bring together the world's  top developers, end users, and vendors and run the largest open source developer conferences. CNCF is part of the nonoprofit Linux Foundation.
````
#### CNCF - Uma organização sem fins lucrativos que promove a adoção de tecnologias de código aberto para aplicativos nativos da nuvem.
#### A CNCF promove a padronização de tecnologias de nuvem, o que aumenta a interoperabilidade entre as plataformas de nuvem.
#### Qualquer pessoa pode submeter uma proposta de projeto para a CNCF, que será avaliada por um comitê técnico antes de ser aprovada ou rejeitada.

- Organização sem fins lucrativos
- Tem varios projetos
- Criado 2015
- Parte da Linux Foundation
- Responsável por famosos projetos:
  - Kubernetes, Prometheus, OTEL, Envoy, Jaeger
- Programas de certificação
  - CKDA
  - CKD
  - CKS
  - KCNA
  - PCA
- Quatro estágios de projetos
  - Graduated, Incubating, Sandbox, and Archived.
- Graduated e Incubating
  - Os projetos no estágio de Graduated são considerados mais maduros e têm uma base de usuários maior do que os projetos no estágio de Incubating.