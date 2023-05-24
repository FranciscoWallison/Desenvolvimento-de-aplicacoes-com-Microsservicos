# SAD SOLUTION ARCHITECTURE DOCUMENT

- Documento que descreve a arquitetura de uma solução
- Trata-se normalmente de:
   - Componentes
   - Módulos
   - Interfaces
   - Interfaces
   - Fluxo de Dados
- Leva em consideração o contexto do projeto
- É gerado na fase de projeto do projeto
- Da clareza aos envolvidos sobre a solução como um todo
- Nem todo SAD possui a mesma estrutura
- Quanto maior o risco do projeto > documentação
- É responsabilidade do arquiteto de solução indicar no SAD custos operacionais e tecnológicos além dos aspectos do projeto.

#### SAD É um documento responsável por nortear várias áreas da empresa:

Como Técnica, comercial e gestão sobre o projeto a ser executado
__________________________________________________________________
````
O SAD é um documento abrangente que fornece diretrizes e informações importantes para várias áreas da empresa. Ele norteia as equipes técnicas, fornecendo informações sobre a arquitetura, tecnologias e padrões a serem utilizados. Além disso, ele também pode ser usado pela equipe comercial para entender as características e os benefícios do sistema proposto, ajudando nas atividades de venda e negociação. A gestão do projeto também pode se beneficiar do SAD, utilizando-o como referência para o acompanhamento e o controle do desenvolvimento do projeto.

````
## Quais tópicos normalmente são tratados
- Introdução 
   - Propósito do documento
   - Escopo da solução 
   - Restrições
   - Pressupostos
- Visão geral da arquitetura
   - Descritivo com principais pontos
   - Diagrama de alto nível
   - Principais componentes
   - Diagramas de fluxo
- Requisitos
   - Funcionais
      - Recursos, funcionalidades, features que agregam valor ao negócio
      - Features de valor, recursos, funcionalidades
   - Não funcionais
      - Ex: Performance, escalabilidade, segurança, disponibilidade + cross-cutting
      - Escalabilidade, performance, segurança

- Design da arquitetura
   - Diagramas detalhados bem como sua descrição
   - Tecnologia a serem utilizadas
   - Integração entre sistemas
   - Integrações entre sistemas

- Implementação
   - Metodologias de desenvolvimento e ferramentas
   - Processos de deployment e infraestrutura
   - Processos de teste e qualidade
   I - Definição da metodologia de trabalho e processos de testes e qualidade:
````
   Essa premissa está diretamente relacionada ao tópico de "Implementação". Na fase de implementação, é importante estabelecer a metodologia de trabalho que será utilizada, incluindo as práticas de desenvolvimento, processos de testes e garantia de qualidade. Isso envolve definir como as tarefas serão executadas, quais metodologias ágeis ou tradicionais serão seguidas, bem como estabelecer os processos de testes e as métricas de qualidade a serem adotadas.
````
   II - Criar um processo de deployment e elencar como será o ambiente:
````
   Essa premissa também faz parte do tópico de "Implementação". Durante a implementação, é necessário definir como será realizado o deployment do sistema, ou seja, como as atualizações e novas versões serão implantadas no ambiente de produção. Além disso, é importante elencar como será configurado o ambiente, incluindo servidores, bancos de dados, serviços externos, entre outros elementos necessários para a execução do sistema em produção.
````

- Operação e Manutenção
   - Monitoramento
   - Processos de manutenção
   - Disaster recovery
   - Processo de gerenciamento de mudanças

- Riscos e estratégias de mitigação
   - Riscos potencias
   - Riscos de grande impacto
   - Planos de contingências

- Recuperação de desastres
````
Plano de contingência, riscos potenciais e risco de grande impacto. São aspectos de qual etapa do SAD?
O plano de contingência, riscos potenciais e risco de grande impacto são aspectos da etapa de.
"Recuperação de desastres" do Solution Architecture Document.

   Nessa etapa, são identificados os possíveis riscos e ameaças que podem afetar o sistema, bem
como as medidas de mitigação e recuperação que serão adotadas para lidar com esses riscos.
O plano de contingência descreve as ações específicas que devem ser tomadas em caso de ocorrência
de um evento adverso que possa comprometer a disponibilidade ou o funcionamento adequado do sistema.
````
