
# Commits semânticos

Commits semânticos são uma prática de versionamento de código que consiste em registrar pequenas e significativas alterações no repositório de código de forma clara e descritiva. A ideia é tornar os commits uma ferramenta útil para a equipe de desenvolvimento, ajudando a entender e rastrear as mudanças no código ao longo do tempo.

Commits semânticos têm uma mensagem clara e concisa que descreve o que foi alterado e por quê. Eles evitam registrar várias alterações menores em um único commit, o que pode tornar difícil entender as mudanças no futuro. Além disso, os commits semânticos são projetados para serem independentes e auto-contidos, o que significa que cada commit deve ser capaz de ser compreendido por si só, sem depender de outros commits.

Uma boa prática é escrever a mensagem do commit com um verbo no tempo presente e no infinitivo, como "Adicionar recurso X" ou "Corrigir erro Y". Isto ajuda a fornecer uma visão clara e concisa do que foi feito, tornando mais fácil para os outros membros da equipe entender as alterações.

Em resumo, os commits semânticos são uma boa prática para equipes de desenvolvimento que buscam manter um histórico claro e significativo das mudanças no código. Eles ajudam a melhorar a colaboração, a solução de problemas e a manutenção do código ao longo do tempo.


# Exemplos de mensagens de commit semânticas:

Adicionar funcionalidade de login: Esta mensagem descreve claramente o que foi adicionado ao código, tornando fácil para outros desenvolvedores entenderem o propósito da alteração.

Corrigir erro de formatação na página de perfil: Esta mensagem especifica o que foi corrigido, tornando fácil para outros desenvolvedores entender o motivo da alteração.

Atualizar documentação da API: Esta mensagem descreve uma alteração na documentação, o que pode ser importante para outros desenvolvedores que dependem da API.

Refatorar código da classe X: Esta mensagem descreve uma mudança significativa no código, sem adicionar ou remover funcionalidades. A mensagem explica o que foi feito, tornando fácil para outros desenvolvedores entenderem o propósito da alteração.

Lembre-se de que as mensagens de commit devem ser claras e concisas, mas ainda fornecer suficientes informações para que outros desenvolvedores entendam o que foi feito. Isso ajuda a garantir que o código seja mantido de forma eficiente e confiável ao longo do tempo.


## Ná pratica
````
"feat: [...]": Usado para criação de novas features, endpoints, services e etc
feat: create user service
````

````
"fix: [...]": Solução de erros, bugs e afins
fix: error on create user without profile picture
````
````
"refactor: [...]": Quando for refatorar um trecho de código
refactor: refactor create user service
````

````
"chore: [...]": Alterações que não o funcionamento do sistema nem em testes automatizados,
como alterações no .gitignore, eslint, README.md e etc
chore: use prettier on eslint rules
````

````
"style: [...]": Alterações de estilo que não influenciam no sistema
style: change background color
````

````
"build: [...]": Alterações que impactam apenas o build do projeto
build: create deploy config file
````

````
"test: [...]": Criação ou modificação de testes automatizados
test: testing create user service
````
