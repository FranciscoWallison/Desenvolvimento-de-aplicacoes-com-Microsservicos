# Bypass de SSL Pinning

SSL Pinning faz o app aceitar apenas certificados específicos (não qualquer CA confiável), bloqueando proxies como Burp Suite. O bypass permite interceptar o tráfego HTTPS.

## O que é SSL Pinning

```
Sem pinning:
  App → verifica se cert. é assinado por CA confiável → OK

Com pinning:
  App → verifica se cert. é assinado por CA confiável E
        se o cert/public key bate com o que está hardcoded → OK ou REJEITA
```

## Configurar Burp Suite como Proxy

```bash
# 1. Burp Suite → Proxy → Options → Add listener
#    Interface: 0.0.0.0:8080

# 2. No dispositivo: Wi-Fi → configurar proxy manual
#    Host: IP_DO_PC  Port: 8080

# 3. Instalar certificado do Burp:
#    http://burpsuite/cert → baixar DER
adb push cacert.der /sdcard/
# Dispositivo: Configurações → Segurança → Instalar certificado

# 4. Android 7+ não confia em CAs de usuário por padrão
#    Precisa de root para instalar no system trust store
adb shell su -c "cp /sdcard/cacert.der /system/etc/security/cacerts/burp.crt"
adb shell su -c "chmod 644 /system/etc/security/cacerts/burp.crt"
```

---

## Método 1: Objection (mais rápido)

```bash
objection -g com.exemplo.app explore --startup-command "android sslpinning disable"
```

Desabilita automaticamente:
- OkHttp3 `CertificatePinner`
- `TrustManager` customizado
- `HttpsURLConnection` com hostname verifier customizado
- WebViews

---

## Método 2: Frida Scripts

### OkHttp3 CertificatePinner
```javascript
Java.perform(() => {
    const CertificatePinner = Java.use('okhttp3.CertificatePinner');

    CertificatePinner.check.overload('java.lang.String', 'java.util.List')
        .implementation = function(hostname, certs) {
        console.log('[SSL] check() bypassado para: ' + hostname);
        // não chamar original = bypass
    };

    CertificatePinner.check.overload('java.lang.String', '[Ljava.security.cert.Certificate;')
        .implementation = function(hostname, certs) {
        console.log('[SSL] check(certs) bypassado para: ' + hostname);
    };
});
```

### TrustManager customizado
```javascript
Java.perform(() => {
    const TrustManagerImpl = Java.use('com.android.org.conscrypt.TrustManagerImpl');

    TrustManagerImpl.verifyChain.implementation = function(untrustedChain, trustAnchorChain, host, clientAuth, ocspData, tlsSctData) {
        console.log('[SSL] verifyChain bypassado para: ' + host);
        return untrustedChain;
    };
});
```

### Script universal (cobre mais implementações)
```javascript
// ssl-bypass-universal.js
Java.perform(() => {
    // 1. TrustManager que aceita tudo
    const X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
    const SSLContext = Java.use('javax.net.ssl.SSLContext');

    const TrustManager = Java.registerClass({
        name: 'com.bypass.TrustManager',
        implements: [X509TrustManager],
        methods: {
            checkClientTrusted(chain, authType) {},
            checkServerTrusted(chain, authType) {},
            getAcceptedIssuers() { return []; }
        }
    });

    const TrustManagers = [TrustManager.$new()];
    const sslContext = SSLContext.getInstance('TLS');
    sslContext.init(null, TrustManagers, null);

    // Aplicar ao SSLContext default
    SSLContext.getDefault.implementation = () => sslContext;

    // 2. OkHttp
    try {
        const CertificatePinner = Java.use('okhttp3.CertificatePinner');
        CertificatePinner.check.overload('java.lang.String', 'java.util.List')
            .implementation = function() {};
        CertificatePinner.check.overload('java.lang.String', '[Ljava.security.cert.Certificate;')
            .implementation = function() {};
    } catch(e) {}

    // 3. HostnameVerifier
    const HostnameVerifier = Java.use('javax.net.ssl.HttpsURLConnection');
    HostnameVerifier.setDefaultHostnameVerifier.implementation = function(verifier) {
        this.setDefaultHostnameVerifier(Java.use('javax.net.ssl.HostnameVerifier')
            .$implement({ verify: () => true }));
    };

    console.log('[*] SSL Pinning bypass universal ativo');
});
```

---

## Método 3: Network Security Config (sem root)

Para apps que usam o `network_security_config.xml`, criar patch no APK:

```bash
# 1. Decompiliar
apktool d app.apk

# 2. Criar/modificar res/xml/network_security_config.xml
cat > app/res/xml/network_security_config.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config>
        <trust-anchors>
            <certificates src="system"/>
            <certificates src="user"/>   <!-- confia em CAs do usuário -->
        </trust-anchors>
    </base-config>
    <debug-overrides>
        <trust-anchors>
            <certificates src="system"/>
            <certificates src="user"/>
        </trust-anchors>
    </debug-overrides>
</network-security-config>
EOF

# 3. Garantir que o Manifesto aponta para o arquivo
# AndroidManifest.xml → android:networkSecurityConfig="@xml/network_security_config"

# 4. Recompilar e assinar
apktool b app -o app_patched.apk
apksigner sign --ks test.jks app_patched.apk
adb install -r app_patched.apk
```

---

## Método 4: Instalar CA no System Store (root)

```bash
# Converter certificado Burp para formato aceito pelo Android
openssl x509 -inform DER -in cacert.der -out burp.pem

# Calcular hash do subject
HASH=$(openssl x509 -inform PEM -subject_hash_old -in burp.pem | head -1)

# Renomear e copiar para system store
cp burp.pem ${HASH}.0
adb push ${HASH}.0 /sdcard/

adb shell su -c "mount -o rw,remount /system"
adb shell su -c "cp /sdcard/${HASH}.0 /system/etc/security/cacerts/"
adb shell su -c "chmod 644 /system/etc/security/cacerts/${HASH}.0"
adb reboot

# Verificar: Configurações → Segurança → Certificados confiáveis → Sistema
# O certificado Burp deve aparecer na lista
```

---

## Pinning em Nível Nativo (C/C++)

Apps mais avançados implementam pinning no código nativo via `libssl.so`. Frida ainda pode hookear:

```javascript
// Hook nativo via Interceptor
const SSL_CTX_set_verify = Module.findExportByName('libssl.so', 'SSL_CTX_set_verify');
if (SSL_CTX_set_verify) {
    Interceptor.attach(SSL_CTX_set_verify, {
        onEnter(args) {
            // mode: SSL_VERIFY_NONE = 0
            args[1] = ptr(0);   // desativar verificação
        }
    });
}

// Alternativa: hook no SSL_get_verify_result
const SSL_get_verify_result = Module.findExportByName('libssl.so', 'SSL_get_verify_result');
if (SSL_get_verify_result) {
    Interceptor.replace(SSL_get_verify_result, new NativeCallback(() => 0, 'long', ['pointer']));
}
```
