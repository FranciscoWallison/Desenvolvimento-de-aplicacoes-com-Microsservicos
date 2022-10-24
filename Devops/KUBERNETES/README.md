# k8s - commandos rapidos

## Introcução
````
     - Orquestador de containers...
````

## Objetivo
````
     - Orquestrar os containers de forma escalavel conforme o desempenho imposto pela maquina virtual.
     - Reiniciando aplicações altomaticamente em casos de falhas.
````

## Instalando no Linux
##### K8S
````
      - sudo apt-get install curl -y
      - curl -LO "https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes release/release/stable.txt)/bin/linux/amd64/kubectl"
      - chmod +x ./kubectl
      - sudo mv ./kubectl /usr/local/bin/kubectl
````

##### Minikube
````
      - curl -Lo minikube https://storage.googleapis.com/minikube/releases/v1.12.1/minikube-linux-amd64 \ && chmod +x minikube
      - sudo install minikube /usr/local/bin/
````
Iniciando minikube
````
     - minikube start --vm-driver=virtualbox
```` 
____
##  A arquitetura do Kubernetes

#### Master
````
     - Gerenciar o cluster
     - Manter e atualizar o estado desejado dos POD's
     - Receber e executar novos comandos
````

#### Node
````
      - Executar as aplicações
      - Administra os POD's que por sua vez manipula os CONTAINES
````

#### K8S POD's
Concepts:
_____
     ° É um recurso que encapsular um ou mais container no k8s
     ° Se todos os containers no POD's pararem o POD parar.
        - Containers
            ° Como possuem IP's diferentes, containers em pods diferentes podem utilizar o mesmo número de porta.
            ° Containers dentro de um mesmo pod conseguem se comunicar via localhost.

Command:
_____
````
    ° Criando POD's utilizando imagens
        - kubectl run nginx-pod ---image=nginx:latest
        - kubectl run <NOME_POD> ---image=<NOME_IMAGE>
    ° Criando POD's Declarativa
        - kubectl apply -f pod.yaml
        - kubectl apply -f <FILE_NAME>
    ° Consultando POD's
        - kubectl get pods
        - kubectl get pods --watch
        - kubectl get pods -o wide
    ° Consultando descrição do POD
        - kubectl describe pod nginx-pod
        - kubectl describe pod <NOME_POD>
    ° Editando os POD's
        - kubectl edit pod nginx-pod
        - kubectl edit pod <NOME_POD>
    ° Deletando os POD's imagens
        - kubectl delete pod nginx-pod
        - kubectl delete pod <NOME_POD>
    ° Deletando POD's Declarativa
        - kubectl delete -f pod.yaml
        - kubectl delete -f <FILE_NAME>
    ° Executando comandos POD's Interativa
        - kubectl exec -it pod.yaml -- bash
        - kubectl exec -it <FILE_NAME>
````

#### K8S SERVICES
Para que serve?
_____
    ° Abstrações para expor aplicações executando em um ou mais pods
    ° Proveem IP's fixos para comunicação
    ° Proveem um DNS para um ou mais pods
    ° São capazes de balanceamento de carga
    ° Fazem o balanceamento de carga.
----------------------------------------------------
Tipo/type
_____
    ° ClusterIP
        - Serve para comunicar diferentes POD's do mesmo cluster
        - Através de "labels" definidas no "metadata" e utilizando o campo "selector" no service(SVC).
        - Um ClusterIP funciona apenas dentro do cluster
        - Ótimo para sistema de comunicação com bando 
    ° NodePort
        - Utilizamos o IP do "nó"(NODE) para acessar o service através da porta especificada 
        - Serve para comunicar diferentes POD's para o exterior dentro do cluster
            ° Consultando NodePort
                - kubectl get nodes -o wide
        - Um NodePort expõe Pods para dentro e fora do cluster
        - Ótimo para sistema que tenha comunicação com o Cliente/FrontEnd
    ° LoadBalancer
        - Abre comunicação para o mundo externo usando o Load Balancer do provedor.
        - Utilizam automaticamente os balanceadores de carga de cloud providers.
        - Um LoadBalancer também é um NodePort e ClusterIP.
        - Um LoadBalancer é capaz de automaticamente utilizar um balanceador de carga de um cloud provider.
----------------------------------------------------
Comandos:
_____
````
    ° Criando service
        - kubectl expose deployment hello-nginx --type=LoadBalancer --port=80
    ° Consultando services
        - kubectl get services
        - kubectl get svc
    ° Testando service
        - minikube service hello-nginx
    ° Deletando todos os SERVICES
        - kubectl delete services hello-nginx
````
#### K8S CONFIGMAPS
Para que serve?
_____
    ° Desacoplar configurações dos POD's
----------------------------------------------------
Comandos:
````
    ° Mosrtrado configmaps
        - kubectl get configmaps
````
#### K8S REPLICASETS
Para que serve?
_____
    ° Administra todas os POD's criados, criando redundâncias para cada imagem.
    ° Quando criados, Deployments auxiliam com controle de versionamento e criam um ReplicaSet automaticamente.(Font: Alura)
----------------------------------------------------
Comandos:
_____
````
    ° Consultando REPLICASETS
        - kubectl get rs
        - kubectl get replicasets    
````
#### K8S DEPLOYMENT
Para que serve?
_____
    ° Um Deployments é responsável por criar POD'S e suas respectivas REPLICASETS.
    ° Os Pods normalmente são criados através de Deployments, e não individualmente.
    ° Quando criados, Deployments auxiliam com controle de versionamento e criam um ReplicaSet automaticamente.
    ° Administra todas os POD's criados, criando redundâncias como um REPLICASETS.
    ° Versiona cada POD com o comando "annotate", como se fosse um commit do git.
        - kubectl annotate deployments nginx-deployment kubernetes.io/change-cause="Descrição da imagem"
        - kubectl annotate deployments <NAME_METADATA> kubernetes.io/change-cause="Descrição da imagem"
    ° Podendo restaurar versões POD com o comando "rollout undo"
        - kubectl rollout undo deployments nginx-deployment --to-revision=2
        - kubectl rollout undo deployments  <NAME_METADATA> --to-revision=<HISTORY_NUMBER>
    ° Podendo ver histórico de versões Deployments com o comando "rollout history"
        - kubectl rollout history deployments nginx-deployment
        - kubectl rollout history deployments <NAME_METADATA>
     ° Podendo voltar Deployments com o comando "rollout undo deployment" (Font: Alura)
        - kubectl rollout undo deployment <nome do deployment> --to-revision=<versão a ser retornada>
----------------------------------------------------
Comandos:
_____
````
    ° Criando DEPLOYMENT
        - kubectl create deployment hello-nginx --image=nginx:1.17-alpine
    ° Consultando DEPLOYMENT
        - kubectl get deployments
    ° Deletando todos os DEPLOYMENT
        - kubectl delete deployments --all
    ° Consultar as replicas criadas pelo DEPLOYMENT
        - kubectl get rs
    ° Visualizar o histórico de implantações 
        - kubectl rollout history deployments nginx-deployment
        - kubectl rollout history deployments <NAME_METADATA>
    ° Visualizar todos os históricos de versões Deployments.
        - kubectl rollout history deployments
````
#### K8S PERSISTENTVOLUMECLAIM
Para que serve?
_____
    ° Volumes possuem ciclo de vida dependentes de Pods e independentes de containers.
    ° PersistentVolumes possuem ciclo de vida independente de quaisquer outros recursos, inclusive Pods
    ° Precisamos de um PersistentVolumeClaim para acessar um PersistentVolume
    ° PersistentVolumes persistem dados de pods como um todo
````
    ° Mosrtrado persistentvolumeclaim
        - kubectl get persistentvolumeclaim
        - kubectl get pvc
    ° Deletando todos os PERSISTENTVOLUMECLAIM
        - kubectl delete persistentvolumeclaim <NAME-persistentvolumeclaim>
        - kubectl delete pvc <NAME-persistentvolumeclaim>
````
#### K8S Storage Classes
Para que serve?
_____
    ° Storage Classes fornecem dinamismo para criação de PersistentVolumes conforme demanda.
````
    ° Mosrtrado Storage Classes
        - kubectl get sc
````
#### K8S StatefulSets
Para que serve?
_____
    ° StatefulSets podem ser usados quando estados devem ser persistidos.
    ° StatefulSets usam PersistentVolumes e PersistentVolumeClaims para persistência de dados.
````
````
#### K8S SECRETS
````
    ° Criando Secret mysql
        - kubectl create secret generic mysql-pass --from-literal=password='MyPasswordRoot'
    ° Mosrtrado Secret
        - kubectl get secrets
````
#### Testando Autoscaler
```` 
    ° Comsultando HPA
        - kubectl get hpa
    ° Criando POD e SERVICE aparti de uma image do DOCKER
        - kubectl run php-apache-hpa --image=chicowall/php-apache-hpa --requests=cpu=200m --expose --port=80
        ° Testando (criando pod/maquina busybox) e acessando via bash
            - kubectl run -it loader --image=busybox /bin/sh
            ° Teste estresse (Consultando POD "php-apache-hpa" )
                - wget -q -O- http://php-apache-hpa.default.svc.cluster.local;
            ° Teste estressando Autoscaler
                - while true; do wget -q -O- http://php-apache-hpa.default.svc.cluster.local; done;
```` 

## Dicas
#### Variáveis de Ambiente
    - Podemos usar o campo 'env' para definir uma ou mais variáveis. (Recomendável usar ConfigMap)
#### Testando de maneira declarativa .Yaml
     - https://kubeyaml.com/
#### K8S Acessando containe/POD
Exemplo:
____________________________
```` 
    - kubectl exec -it mysql-server bash
    - kubectl exec -it <NAME-POD> bash    
````
____________________________ 
#### K8S Criando uma publicação [Google Cloud Platform]
    1° - Defina um "Gatilho" em  "Cloud Build"
    2° - Defina seu Repositório no "GITHUB"
    3° - Configuração o Repositório e definindo arquivos cloudbuild.yaml e branch
    4° - Criando arquivo "cloudbuild.yaml" com a versão do "Container Registry" gerado por ("cloud-build-docker-compose")
    5° - Configurando CI pelo arquivo "cloudbuild.yaml" com os test e builds
    6° - Configurando CD pelo arquivo "cloudbuild.yaml" com as imagens e publicando em "Container Registry"
    7° - Dando permissão para "Cloud Build" em  "IAM e administrador" 
    8° - Configurações de K8S para "Deployment"    
