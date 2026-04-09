# Bypass de SSL Pinning no iOS

## Configurar Burp Suite

```bash
# 1. Instalar certificado Burp no dispositivo
# Burp → Proxy → CA Certificate → Download
# No Safari do dispositivo: http://burpsuite → instalar certificado
# Configurações → Geral → VPN e Gerenciamento de Dispositivo → instalar

# 2. Confiar no certificado (iOS 10.3+)
# Configurações → Geral → Sobre → Certificados Raiz Confiáveis → ativar Burp

# 3. Configurar proxy Wi-Fi
# Configurações → Wi-Fi → rede atual → Proxy Manual
# Host: IP_DO_PC  Porta: 8080
```

---

## Método 1: Objection (mais rápido)

```bash
objection -g "NomeDoApp" explore --startup-command "ios sslpinning disable"
```

---

## Método 2: Frida — SecTrust API

```javascript
// Bypass via SecTrustEvaluate e SecTrustEvaluateWithError
const Security = 'Security';

// iOS < 12
const SecTrustEvaluate = Module.findExportByName(Security, 'SecTrustEvaluate');
if (SecTrustEvaluate) {
    Interceptor.replace(SecTrustEvaluate, new NativeCallback(
        function(trust, result) {
            Memory.writeU32(result, 1);  // kSecTrustResultProceed
            return 0;  // errSecSuccess
        }, 'int', ['pointer', 'pointer']
    ));
}

// iOS 12+
const SecTrustEvaluateWithError = Module.findExportByName(
    Security, 'SecTrustEvaluateWithError'
);
if (SecTrustEvaluateWithError) {
    Interceptor.replace(SecTrustEvaluateWithError, new NativeCallback(
        function(trust, error) {
            if (!error.isNull()) Memory.writePointer(error, ptr(0));
            return 1;
        }, 'bool', ['pointer', 'pointer']
    ));
}

console.log('[*] SecTrust bypass ativo');
```

---

## Método 3: NSURLSession / NSURLConnection

```javascript
ObjC.schedule(ObjC.mainQueue, () => {
    // Hook no delegate de autenticação do NSURLSession
    const NSURLSession = ObjC.classes.NSURLSession;

    // Encontrar método de challenge de autenticação
    // -[NSURLSessionDelegate URLSession:didReceiveChallenge:completionHandler:]
    
    // Alternativa: hook no método que cria a session com configuração de pinning
    Interceptor.attach(
        NSURLSession['+ sessionWithConfiguration:delegate:delegateQueue:'].implementation,
        {
            onEnter(args) {
                const config = new ObjC.Object(args[2]);
                // Remover configuração de TLS customizada
                // (se a session usa delegate para pinning)
            }
        }
    );
});
```

---

## Método 4: AFNetworking (biblioteca comum)

```javascript
ObjC.schedule(ObjC.mainQueue, () => {
    // AFNetworking usa AFSecurityPolicy para pinning
    try {
        const AFSecurityPolicy = ObjC.classes.AFSecurityPolicy;

        // Substituir pinnedCertificates por set vazio
        Interceptor.attach(
            AFSecurityPolicy['- evaluateServerTrust:forDomain:'].implementation,
            {
                onLeave(retval) {
                    retval.replace(ptr(1));  // retornar YES (confiável)
                    console.log('[SSL] AFNetworking bypass ativo');
                }
            }
        );
    } catch(e) {
        // AFNetworking não presente neste app
    }
});
```

---

## Método 5: Repackaging com Network Security (sem jailbreak)

Para apps que usam `Info.plist` para configurar segurança de rede:

```bash
# 1. Extrair o IPA
unzip App.ipa

# 2. Editar Info.plist — adicionar NSExceptionDomains
# Payload/App.app/Info.plist
# Adicionar:
# <key>NSAppTransportSecurity</key>
# <dict>
#     <key>NSAllowsArbitraryLoads</key>
#     <true/>
# </dict>

# 3. Remover assinatura e reassinar
codesign --remove-signature Payload/App.app/App
ldid -S Payload/App.app/App

# 4. Reempacotar e instalar via TrollStore
zip -r App_patched.ipa Payload/
# Instalar via TrollStore
```

---

## Script Universal iOS SSL Bypass

```javascript
// ios-ssl-bypass.js — cobre múltiplos frameworks
(function() {
    'use strict';
    
    const Security = 'Security';
    
    // SecTrustEvaluate (iOS < 12)
    const trustEval = Module.findExportByName(Security, 'SecTrustEvaluate');
    if (trustEval) {
        Interceptor.replace(trustEval, new NativeCallback(
            (trust, result) => { Memory.writeU32(result, 1); return 0; },
            'int', ['pointer', 'pointer']
        ));
        console.log('[SSL] SecTrustEvaluate hooked');
    }
    
    // SecTrustEvaluateWithError (iOS 12+)
    const trustEvalError = Module.findExportByName(Security, 'SecTrustEvaluateWithError');
    if (trustEvalError) {
        Interceptor.replace(trustEvalError, new NativeCallback(
            (trust, error) => { if (!error.isNull()) Memory.writePointer(error, ptr(0)); return 1; },
            'bool', ['pointer', 'pointer']
        ));
        console.log('[SSL] SecTrustEvaluateWithError hooked');
    }
    
    // AFNetworking
    ObjC.schedule(ObjC.mainQueue, () => {
        if (ObjC.classes.AFSecurityPolicy) {
            Interceptor.attach(
                ObjC.classes.AFSecurityPolicy['- evaluateServerTrust:forDomain:'].implementation,
                { onLeave(r) { r.replace(ptr(1)); } }
            );
            console.log('[SSL] AFNetworking hooked');
        }
        
        // Alamofire (Swift)
        // Os símbolos são mangled — usar frida-trace para encontrá-los
        // frida-trace -U -f "App" -m "*[*ServerTrust*]"
    });
})();
```

```bash
frida -U -f "com.banco.ios" -l ios-ssl-bypass.js --no-pause
```
