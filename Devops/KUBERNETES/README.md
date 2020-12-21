## Introcução
````


````

## Objetivo
````

````


## Comandos
#### K8S POD's
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
    ° Criando configmaps
        - kubectl get configmaps
````
#### K8S PERSISTENTVOLUMECLAIM
````
    ° Criando persistentvolumeclaim
        - kubectl get persistentvolumeclaim
````

