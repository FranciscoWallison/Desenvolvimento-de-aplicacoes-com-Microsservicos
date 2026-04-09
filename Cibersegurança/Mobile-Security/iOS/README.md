# iOS Security

## Seções

| Seção | Descrição |
|---|---|
| [01-arquitetura](./01-arquitetura/README.md) | Entitlements, codesigning, sandbox, SIP |
| [02-ferramentas](./02-ferramentas/README.md) | TrollStore, Frida, Objection |
| [03-ataques-e-testes](./03-ataques-e-testes/README.md) | Bypass jailbreak detection, SSL pinning |

## Diferença-chave vs Android

| Aspecto | Android | iOS |
|---|---|---|
| Root | Magisk / KernelSU | Jailbreak (checkra1n, palera1n) |
| Sideload sem jailbreak | APK direto via ADB | TrollStore (exploração de CoreTrust) |
| Análise dinâmica | Frida via ADB | Frida via SSH (jailbreak) ou TrollStore |
| Permissões | Runtime permissions | Entitlements + Info.plist |
| Sandbox | SELinux + App sandbox | iOS sandbox (Seatbelt) |

## Ambiente Recomendado

```
Dispositivo físico + TrollStore  →  análise sem jailbreak completo
Dispositivo físico + Jailbreak    →  acesso total ao sistema
Simulador Xcode                   →  limitado, sem kernel real
```
