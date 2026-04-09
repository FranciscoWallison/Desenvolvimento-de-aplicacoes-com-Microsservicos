# Arquitetura iOS — Segurança

## Camadas do Sistema

```
┌──────────────────────────────────────┐
│  Apps (IPA)                          │  Swift / Objective-C
├──────────────────────────────────────┤
│  Cocoa Touch / UIKit                 │  Framework de UI e APIs
├──────────────────────────────────────┤
│  Core Services                       │  Foundation, CoreData, Security.framework
├──────────────────────────────────────┤
│  Core OS / Darwin                    │  XNU Kernel (Mach + BSD)
└──────────────────────────────────────┘
```

## Modelo de Segurança

### Code Signing (Assinatura de Código)
Todo código executável no iOS **deve** ser assinado por uma das entidades:
- Apple (apps da App Store)
- Desenvolvedor com certificado Apple (distribuição enterprise ou desenvolvimento)
- TrollStore (exploração da assinatura `CoreTrust`)

```bash
# Verificar assinatura de um binário
codesign -dv --verbose=4 /path/to/binary

# Verificar entitlements
ldid -e /path/to/binary
```

### Entitlements
Declarações XML que determinam o que um app pode acessar:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" ...>
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>group.com.exemplo.shared</string>
    </array>
    <key>com.apple.developer.associated-domains</key>
    <array>
        <string>applinks:exemplo.com</string>
    </array>
    <!-- Entitlements perigosos -->
    <key>platform-application</key>     <!-- acesso a APIs privadas -->
    <true/>
    <key>get-task-allow</key>           <!-- permite debugger se conectar -->
    <true/>
    <key>com.apple.private.security.no-sandbox</key>  <!-- sem sandbox! -->
    <true/>
</dict>
</plist>
```

### Sandbox (Seatbelt)
Baseado em BSD Sandbox / TrustedBSD MAC framework:
- Cada app tem seu container isolado em `/var/mobile/Containers/`
- Acesso a outros containers proibido sem entitlements específicos
- Comunicação entre apps via: URL Schemes, App Groups, Pasteboard, Extensions

### SIP — System Integrity Protection
Protege partições do sistema (`/System`, `/usr`, `/bin`) contra modificação:
- Ativo mesmo com root
- Desabilitar requer boot em Recovery Mode
- No iOS: equivalente é o Secure Enclave + Kernel Integrity Protection

### Secure Enclave
Co-processador dedicado para operações criptográficas:
- Chaves biométricas (Face ID / Touch ID) nunca saem do Secure Enclave
- Chaves protegidas por `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`
- Não pode ser acessado nem com jailbreak

## Estrutura de um IPA

```
App.ipa (ZIP)
└── Payload/
    └── App.app/
        ├── App               ← binário Mach-O (executável principal)
        ├── Info.plist        ← metadados do app
        ├── embedded.mobileprovision  ← perfil de provisionamento
        ├── _CodeSignature/   ← assinaturas de todos os arquivos
        ├── Frameworks/       ← frameworks embarcados
        └── Resources/        ← assets, nibs, strings
```

## XNU Kernel

O kernel do iOS/macOS — híbrido de Mach + BSD:

```
Mach (microkernel)          → IPC via Mach ports, gerenciamento de memória
BSD (POSIX)                 → sistema de arquivos, rede, processos
I/O Kit                     → drivers de hardware em C++
```

### Mach Ports — IPC do iOS
Sistema de comunicação entre processos via mensagens:
```
springboard (processo pai) ←→ Mach port ←→ app
backboardd                 ←→ Mach port ←→ app (eventos de toque)
```

Com jailbreak/TrollStore com entitlements elevados, é possível interagir com Mach ports de outros processos.
