# Arquitetura Android

## Camadas do Sistema

```
┌─────────────────────────────────────┐
│  Nível 4 — Aplicações (APK)         │  Java / Kotlin
├─────────────────────────────────────┤
│  Nível 3 — Android Framework        │  ActivityManager, PackageManager...
├─────────────────────────────────────┤
│  Nível 2 — Native Libraries         │  C/C++, NDK/JNI, ART/Dalvik
├─────────────────────────────────────┤
│  Nível 1 — HAL                      │  Hardware Abstraction Layer
├─────────────────────────────────────┤
│  Nível 0 — Kernel Linux             │  Syscalls, drivers, LKM, eBPF
└─────────────────────────────────────┘
```

Ver detalhes em [camadas-sistema.md](./camadas-sistema.md)

## Modelo de Segurança

### Sandbox por UID
Cada app recebe um UID Linux único. O kernel garante isolamento — um app não acessa arquivos de outro sem permissão explícita.

### Permissões
- **Normal**: concedidas automaticamente no install
- **Dangerous**: solicitadas em runtime (câmera, localização, contatos)
- **Signature**: concedidas apenas a apps com mesma assinatura que o sistema
- **System**: reservadas para apps do sistema (`/system/priv-app`)

### SELinux (Android 5+)
- Modo **enforcing** por padrão
- Cada processo tem um contexto de segurança (`u:r:untrusted_app:s0`)
- Regras de política definem quais syscalls/acessos são permitidos
- Bypass requer modificação da política ou exploração de vulnerabilidade

### Binder IPC
Mecanismo principal de comunicação entre processos no Android.
- Usado por todos os serviços do sistema (ActivityManager, PackageManager, etc.)
- Opera via `/dev/binder` (driver no kernel)
- Objetos `IBinder` são referências remotas entre processos
- Alternativa nativa: AIDL (Android Interface Definition Language)

## Fluxo de Boot

```
Bootloader (verificado) → Kernel → init → Zygote → SystemServer → Launcher
```

- **Bootloader**: verifica assinatura do kernel (Verified Boot)
- **Zygote**: processo pai de todas as apps (pré-carrega classes ART)
- **SystemServer**: inicia todos os serviços do framework
- **Magisk** injeta-se no processo `init` via `init.rc` hooks
- **KernelSU** injeta-se antes — diretamente no kernel
