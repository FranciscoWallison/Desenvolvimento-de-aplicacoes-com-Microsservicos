## Introcução
````
     - 

````

## Objetivo
````
     - Orquestrar os containers de forma escalavel conforme o desempenho imposto pela maquina virtual.
     - Reiniciando aplicações altomaticamente em casos de falhas.
````
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


## Comandos
### Exec Linux
     - minikube start --vm-driver=virtualbox
#### K8S POD's
 ° É um recurso que encapsular um container no k8s
````
    ° Criando POD's
        - kubectl apply -f pod.yaml
    ° Consultando POD's
        - kubectl get pods
````
#### K8S DEPLOYMENT
````
    ° Criando DEPLOYMENT
        - kubectl create deployment hello-nginx --image=nginx:1.17-alpine
    ° Consultando DEPLOYMENT
        - kubectl get deployments
    ° Deletando todos os DEPLOYMENT
        - kubectl delete deployments --all
````
#### K8S SERVICES
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
````
    ° Mosrtrado configmaps
        - kubectl get configmaps
````
#### K8S PERSISTENTVOLUMECLAIM
````
    ° Mosrtrado persistentvolumeclaim
        - kubectl get persistentvolumeclaim
        - kubectl get pvc
    ° Deletando todos os PERSISTENTVOLUMECLAIM
        - kubectl delete persistentvolumeclaim <NAME-persistentvolumeclaim>
        - kubectl delete pvc <NAME-persistentvolumeclaim>
````
#### K8S SECRETS
````
    ° Criando Secret mysql
        - kubectl create secret generic mysql-pass --from-literal=password='MyPasswordRoot'
    ° Mosrtrado Secret
        - kubectl get secrets
````
#### K8S Acessando containe
Exemplo:
____________________________
```` 
    - kubectl exec -it <NAME-POD> bash
    - kubectl exec -it mysql-server-7885f79678-x7fw6 bash
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
