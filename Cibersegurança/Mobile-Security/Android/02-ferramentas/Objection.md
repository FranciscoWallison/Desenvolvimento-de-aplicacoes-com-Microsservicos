# Objection

Shell interativo construído sobre Frida que automatiza as tarefas mais comuns de análise dinâmica, sem precisar escrever scripts manualmente.

Repositório: https://github.com/sensepost/objection

## Instalação

```bash
pip install objection
```

## Conectar ao App

```bash
# App já rodando
objection -g com.exemplo.app explore

# Spawn (inicia o app)
objection -g com.exemplo.app explore --startup-command "android sslpinning disable"
```

## Comandos Essenciais

### Root / Jailbreak Detection
```bash
# Dentro do shell objection:
android root disable               # desativa detecções de root
android root simulate              # simula um dispositivo rootado
```

### SSL Pinning
```bash
android sslpinning disable         # bypass da maioria dos SSL pinnings
```

### Exploração de memória
```bash
memory list modules                # lista .so carregados
memory list exports libssl.so      # exportações de uma biblioteca
memory search "password" --string  # busca string na memória
memory dump all /tmp/dump.bin      # dump completo da memória do processo
```

### Sistema de arquivos
```bash
android filesystem ls /data/data/com.exemplo.app/
android filesystem download /data/data/com.exemplo.app/shared_prefs/config.xml ./config.xml
android filesystem upload ./payload.json /data/data/com.exemplo.app/files/
```

### SharedPreferences
```bash
android shared_preferences list                    # lista todos os arquivos
android shared_preferences get main_prefs          # conteúdo de um arquivo
```

### Keystore / Chaves
```bash
android keystore list               # lista entradas no Android Keystore
```

### Hooking de classes
```bash
android hooking list classes                           # todas as classes
android hooking list classes_using_loader             # classes por classloader
android hooking search classes Auth                   # buscar por nome
android hooking search methods login                  # buscar método
android hooking watch class com.exemplo.app.Auth      # hookeia toda a classe
android hooking watch class_method com.exemplo.app.Auth.validateToken --dump-args --dump-return
```

### Intents
```bash
android intent launch_activity com.exemplo.app.InternalActivity
android intent launch_service com.exemplo.app.BackgroundService
```

### Screenshots
```bash
android ui screenshot /tmp/screen.png
```

## Workflow Típico de Análise

```bash
# 1. Conectar com bypass de SSL ativado desde o início
objection -g com.exemplo.app explore --startup-command "android sslpinning disable"

# 2. Desativar root detection
android root disable

# 3. Explorar SharedPreferences em busca de tokens
android shared_preferences list
android shared_preferences get <nome_do_arquivo>

# 4. Monitorar métodos de autenticação
android hooking watch class_method com.exemplo.app.auth.TokenManager.getToken --dump-return

# 5. Baixar banco de dados local
android filesystem ls /data/data/com.exemplo.app/databases/
android filesystem download /data/data/com.exemplo.app/databases/app.db ./app.db
```

## Objection vs Frida direto

| | Objection | Frida direto |
|---|---|---|
| Curva de aprendizado | Baixa (comandos prontos) | Alta (escrever scripts JS) |
| Flexibilidade | Média | Total |
| Velocidade de análise | Alta | Depende do script |
| Bypass SSL | Um comando | Script necessário |
| Uso ideal | Reconhecimento inicial | Ataques customizados |
