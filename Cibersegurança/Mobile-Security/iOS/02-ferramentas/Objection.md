# Objection no iOS

Mesma ferramenta do Android, com comandos adaptados para iOS e Objective-C.

## Conectar

```bash
# App já rodando
objection -g "Nome do App" explore

# Spawn
objection -g "com.exemplo.app" explore

# Com bypass de SSL ativo desde o início
objection -g "Nome do App" explore --startup-command "ios sslpinning disable"
```

## Comandos iOS Específicos

### Jailbreak / Root Detection
```bash
ios jailbreak disable          # bypass de detecção de jailbreak
```

### SSL Pinning
```bash
ios sslpinning disable         # bypass da maioria dos patchings de SSL
```

### Keychain
```bash
ios keychain dump              # dump completo do keychain do app
ios keychain dump --json       # em formato JSON
```

### Sistema de Arquivos do App
```bash
ios filesystem ls              # listar container do app
ios filesystem ls /var/mobile/Containers/Data/Application/<UUID>/Documents/
ios filesystem download ./Documents/config.plist ./config.plist
ios filesystem upload ./payload.json ./Documents/payload.json
```

### NSUserDefaults (equivalente ao SharedPreferences)
```bash
ios nsuserdefaults get         # listar todas as preferências
```

### Cookies
```bash
ios cookies get                # cookies do app
```

### Hooking de Classes
```bash
ios hooking list classes                    # todas as classes
ios hooking search classes Auth             # filtrar por nome
ios hooking list class_methods LoginVC      # métodos de uma classe
ios hooking watch class LoginViewController # hookear toda a classe
ios hooking watch method "-[LoginViewController loginWithUser:password:]" \
    --dump-args --dump-return               # método específico
```

### Pasteboard
```bash
ios pasteboard monitor         # monitorar mudanças no clipboard
```

## Workflow Típico iOS

```bash
# 1. Conectar com SSL bypass
objection -g "BancoApp" explore --startup-command "ios sslpinning disable"

# 2. Desativar detecção de jailbreak
ios jailbreak disable

# 3. Dump do keychain
ios keychain dump

# 4. Verificar NSUserDefaults
ios nsuserdefaults get

# 5. Monitorar métodos de autenticação
ios hooking watch method "-[AuthManager validateToken:]" --dump-args --dump-return

# 6. Explorar arquivos do container
ios filesystem ls
ios filesystem download ./Library/Preferences/com.banco.app.plist ./prefs.plist
```
