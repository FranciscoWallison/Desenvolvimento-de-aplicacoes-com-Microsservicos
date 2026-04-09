# Frida

Framework de **instrumentação dinâmica** que permite injetar scripts JavaScript em processos Android (e iOS) em runtime, hookando funções sem modificar o APK.

Repositório: https://github.com/frida/frida

## Como Funciona

```
Host (PC)                         Dispositivo Android
┌──────────────┐                  ┌──────────────────────┐
│ frida CLI    │ ←── USB/TCP ──→  │ frida-server         │
│ frida scripts│                  │   └── injeta no PID  │
└──────────────┘                  │         └── processo  │
                                  └──────────────────────┘
```

O `frida-server` roda como root no dispositivo e atua como agente. O cliente no PC conecta via ADB ou TCP e injeta código no processo alvo.

## Modos de Operação

| Modo | Descrição | Quando usar |
|---|---|---|
| **Attached** | Conecta a processo já rodando | App em execução |
| **Spawn** | Inicia o app e pausa antes do código rodar | Interceptar inicialização |
| **Frida Gadget** | Biblioteca embutida no APK | Sem root |

## Setup

```bash
# 1. Instalar Frida no host
pip install frida-tools

# 2. Baixar frida-server para a arquitetura do dispositivo
# https://github.com/frida/frida/releases
# Ex: frida-server-16.x.x-android-arm64.xz

# 3. Instalar no dispositivo
adb push frida-server /data/local/tmp/frida-server
adb shell chmod 755 /data/local/tmp/frida-server
adb shell su -c /data/local/tmp/frida-server &

# 4. Verificar
frida-ps -U                   # lista processos no dispositivo USB
frida-ps -U | grep nome_app   # filtrar app específico
```

## Comandos Básicos

```bash
# Listar processos
frida-ps -U

# Conectar a processo rodando
frida -U -n "com.exemplo.app"

# Spawn (iniciar e pausar)
frida -U -f "com.exemplo.app" --no-pause

# Executar script
frida -U -f "com.exemplo.app" -l meu-script.js --no-pause

# Trace de chamadas de método
frida-trace -U -f "com.exemplo.app" -j '*!*login*'
```

## Scripts Essenciais

### Listar classes carregadas
```javascript
Java.perform(() => {
    Java.enumerateLoadedClasses({
        onMatch(className) {
            if (className.includes('Auth') || className.includes('Security')) {
                console.log(className);
            }
        },
        onComplete() {}
    });
});
```

### Hook de método Java
```javascript
Java.perform(() => {
    const Activity = Java.use('android.app.Activity');
    
    Activity.onCreate.overload('android.os.Bundle').implementation = function(bundle) {
        console.log('[*] onCreate chamado em: ' + this.getClass().getName());
        return this.onCreate(bundle);  // chama implementação original
    };
});
```

### Bypass de root detection simples
```javascript
Java.perform(() => {
    // Hook no método que verifica root
    const RootDetector = Java.use('com.exemplo.app.security.RootDetector');
    
    RootDetector.isRooted.implementation = function() {
        console.log('[*] isRooted() interceptado — retornando false');
        return false;
    };
});
```

### Interceptar chamadas de rede (OkHttp)
```javascript
Java.perform(() => {
    const OkHttpClient = Java.use('okhttp3.OkHttpClient');
    const Request = Java.use('okhttp3.Request');
    
    // Hook no método newCall para capturar URLs
    OkHttpClient.newCall.implementation = function(request) {
        console.log('[HTTP] URL: ' + request.url().toString());
        return this.newCall(request);
    };
});
```

### Dump de chaves SharedPreferences
```javascript
Java.perform(() => {
    const SharedPreferences = Java.use('android.app.SharedPreferencesImpl');
    
    SharedPreferences.getString.overload('java.lang.String', 'java.lang.String')
        .implementation = function(key, defValue) {
        const result = this.getString(key, defValue);
        console.log(`[SharedPrefs] ${key} = ${result}`);
        return result;
    };
});
```

## Modo Gadget (sem root)

Embute o Frida como biblioteca dentro do APK, eliminando a necessidade de root:

```bash
# 1. Descompilar APK
apktool d app.apk

# 2. Baixar frida-gadget .so para a arquitetura alvo
# https://github.com/frida/frida/releases
# Ex: frida-gadget-16.x.x-android-arm64.so.xz

# 3. Copiar para lib/arm64-v8a/libfrida-gadget.so

# 4. Adicionar System.loadLibrary("frida-gadget") na Activity principal
# Via smali/Java antes do setContentView()

# 5. Recompilar e assinar
apktool b app -o app_patched.apk
apksigner sign --ks keystore.jks app_patched.apk
```

## Frida vs Xposed

| Aspecto | Frida | Xposed/LSPosed |
|---|---|---|
| Persistência | Sessão (não persiste) | Persistente (módulo instalado) |
| Requisito | root + frida-server | root + Magisk + Zygisk |
| Linguagem | JavaScript | Java/Kotlin |
| Velocidade | Alta (JIT) | Normal |
| Detecção | Detectável via `/proc/maps` | Mais difícil de detectar |
