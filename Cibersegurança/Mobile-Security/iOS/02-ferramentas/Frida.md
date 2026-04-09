# Frida no iOS

O mesmo framework de instrumentação dinâmica do Android, adaptado para iOS. Hooks em Objective-C e Swift em runtime.

## Setup

### Via Jailbreak (método tradicional)

```bash
# No dispositivo jailbroken via Cydia/Sileo:
# Adicionar repositório: https://build.frida.re
# Instalar: frida

# No host (PC):
pip install frida-tools

# Conectar via USB
frida-ps -U                     # listar processos
frida -U -n "Nome do App"       # conectar
```

### Via TrollStore (sem jailbreak completo)

```bash
# 1. Usar FridaLoader ou frida-server IPA para TrollStore
# 2. Após instalado, frida-server roda como daemon
# 3. Conectar normalmente via frida-ps -U
```

### Via SSH Tunnel

```bash
# Encaminhar porta do frida-server via SSH
ssh -R 27042:localhost:27042 root@<IP>

# Conectar via rede
frida-ps -H 127.0.0.1
```

## Diferenças iOS vs Android

| Aspecto | Android | iOS |
|---|---|---|
| Runtime | Java/ART | Objective-C/Swift + ObjC runtime |
| API Frida | `Java.perform()` | `ObjC.classes` |
| Hook de método | `.implementation` | `.implementation` (igual) |
| Listar classes | `Java.enumerateLoadedClasses` | `ObjC.classes` (objeto direto) |
| Injeção de lib | frida-gadget.so | frida-gadget.dylib |

## Scripts Essenciais para iOS

### Listar classes e métodos

```javascript
// Listar todas as classes que contêm "Auth"
for (const name in ObjC.classes) {
    if (name.includes('Auth') || name.includes('Security')) {
        console.log(name);
    }
}
```

```javascript
// Listar métodos de uma classe
const MyClass = ObjC.classes.MyClassName;
const methods = MyClass.$ownMethods;
methods.forEach(m => console.log(m));
```

### Hook de método Objective-C

```javascript
// Hook em método de instância
const NSURLSession = ObjC.classes.NSURLSession;

Interceptor.attach(
    NSURLSession['- dataTaskWithRequest:completionHandler:'].implementation,
    {
        onEnter(args) {
            const request = new ObjC.Object(args[2]);
            const url = request.URL().absoluteString().toString();
            console.log('[NSURLSession] URL: ' + url);
        }
    }
);
```

### Bypass de SSL Pinning iOS

```javascript
// Hook no SecTrustEvaluate (API de baixo nível do iOS)
const SecTrustEvaluate = Module.findExportByName('Security', 'SecTrustEvaluate');
Interceptor.replace(SecTrustEvaluate, new NativeCallback(
    function(trust, result) {
        // Escrever kSecTrustResultProceed no resultado
        Memory.writeU32(result, 1);
        return 0;  // errSecSuccess
    },
    'int', ['pointer', 'pointer']
));

// Hook no SecTrustEvaluateWithError (iOS 12+)
const SecTrustEvaluateWithError = Module.findExportByName(
    'Security', 'SecTrustEvaluateWithError'
);
Interceptor.replace(SecTrustEvaluateWithError, new NativeCallback(
    function(trust, error) {
        if (!error.isNull()) Memory.writePointer(error, NULL);
        return 1;  // true = trust válido
    },
    'bool', ['pointer', 'pointer']
));
```

### Hook em Swift

Swift usa name mangling — use `frida-ps` + `nm` para encontrar o nome real:

```bash
# Encontrar símbolo Swift no binário
nm -U /var/containers/Bundle/Application/.../App.app/App | grep -i "login"
# Resultado: _$s3App11LoginViewC5loginyyF (mangled)
```

```javascript
// Hook em função Swift via símbolo mangled
const loginFunc = Module.findExportByName(null, '_$s3App11LoginViewC5loginyyF');
if (loginFunc) {
    Interceptor.attach(loginFunc, {
        onEnter(args) {
            console.log('[Swift] login() chamado');
        }
    });
}
```

### Dump de Keychain

```javascript
// Listar todos os itens do Keychain do app
ObjC.schedule(ObjC.mainQueue, () => {
    const SecItemCopyMatching = new NativeFunction(
        Module.findExportByName('Security', 'SecItemCopyMatching'),
        'int', ['pointer', 'pointer']
    );
    
    // Query para todos os itens
    const query = ObjC.classes.NSMutableDictionary.dictionary();
    query.setObject_forKey_(
        ObjC.classes.NSString.stringWithString_('genp'),
        ObjC.classes.NSString.stringWithString_('class')
    );
    query.setObject_forKey_(
        ObjC.classes.NSNumber.numberWithBool_(true),
        ObjC.classes.NSString.stringWithString_('r_attributes')
    );
    
    const resultRef = Memory.alloc(Process.pointerSize);
    const status = SecItemCopyMatching(query.handle, resultRef);
    
    if (status === 0) {
        const result = new ObjC.Object(Memory.readPointer(resultRef));
        console.log('[Keychain] ' + result.description().toString());
    }
});
```

## Frida Gadget no iOS (sem jailbreak)

Embutir o Frida Gadget em um IPA:

```bash
# 1. Descompactar IPA
unzip App.ipa

# 2. Baixar frida-gadget para iOS ARM64
# https://github.com/frida/frida/releases
# frida-gadget-16.x.x-ios-universal.dylib.xz

# 3. Copiar para Frameworks/
cp frida-gadget.dylib Payload/App.app/Frameworks/FridaGadget.dylib

# 4. Injetar load command no binário principal
# Usando insert_dylib ou otool
insert_dylib --strip-codesig --inplace \
    '@rpath/FridaGadget.dylib' Payload/App.app/App

# 5. Assinar com ldid (para TrollStore) ou codesign (para dev)
ldid -S Payload/App.app/App

# 6. Reempacotar
zip -r App_patched.ipa Payload/

# 7. Instalar via TrollStore
# Ao iniciar o app, ele pausará aguardando conexão Frida
frida -U "Gadget"
```
