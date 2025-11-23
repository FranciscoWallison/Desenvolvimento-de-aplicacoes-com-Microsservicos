### 1. Requisito Funcional (O "O Que")
*Lembre-se: É a funcionalidade. Se o sistema não fizer isso, ele não serve para o propósito dele.*

* **O Requisito:** "O sistema deve permitir que o usuário rastreie a localização do entregador em tempo real no mapa."
* **Por que é funcional?** Porque descreve uma **função** específica que o software precisa ter. É uma ação que o sistema executa.

### 2. Requisito Não-Funcional (A "Restrição" ou "Qualidade")
*Lembre-se: É o "como". Define a qualidade, desempenho ou restrição técnica.*

* **O Requisito:** "A localização do entregador no mapa deve ser atualizada com um atraso (latência) máximo de 5 segundos."
* **Por que é não-funcional?** Porque define uma **restrição de desempenho**.
    * Se o mapa funcionar (funcional), mas atualizar a cada 10 minutos (não-funcional falho), a função existe, mas é inútil para o usuário, gerando a frustração mencionada no seu texto.

---

### Visualizando a Diferença

Para facilitar, veja esta comparação lado a lado:



| Tipo | Pergunta Chave | Exemplo no App de Delivery |
| :--- | :--- | :--- |
| **Funcional** | O que o sistema faz? | O sistema deve calcular o valor total do pedido somando os itens e o frete. |
| **Não-Funcional** | Como ele deve se comportar? | O cálculo do valor total deve ser processado em menos de 1 segundo (Performance). |
| **Não-Funcional** | Sob quais regras? | O sistema deve rodar em smartphones Android versão 10 ou superior (Compatibilidade). |

### Conexão com o seu texto (Os Riscos)

O seu texto dizia: *"Uma falha nos requisitos básicos (...) pode gerar difícil usabilidade"*.

No nosso exemplo:
1.  Se esquecermos o **Funcional** (rastreamento), o cliente fica ansioso sem saber onde está a comida (**Falta de funções importantes**).
2.  Se esquecermos o **Não-Funcional** (atualizar a cada 5 segundos) e o mapa travar ou demorar muito, o cliente não confia no sistema (**Difícil usabilidade**).

