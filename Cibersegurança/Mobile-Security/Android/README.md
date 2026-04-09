# Android Security

## Seções

| Seção | Descrição |
|---|---|
| [01-arquitetura](./01-arquitetura/README.md) | Camadas do sistema, sandbox, permissões, IPC |
| [02-ferramentas](./02-ferramentas/README.md) | Magisk, KernelSU, Frida, JADX, MobSF |
| [03-ataques-e-testes](./03-ataques-e-testes/README.md) | Emulator spoofing, bypass root/SSL |
| [04-nivel-kernel](./04-nivel-kernel/README.md) | KernelSU, LKM, eBPF, syscall interception |

## Ambiente Recomendado

```
Dispositivo físico rootado  →  melhor para análise real
Emulador AVD + RootAVD      →  melhor para desenvolvimento/testes rápidos
Genymotion                  →  alternativa com melhor performance
```

## Stack de Ferramentas

```
Análise Estática:  JADX + MobSF + APKTool
Análise Dinâmica:  Frida + Objection + Burp Suite
Root/Sistema:      Magisk (userspace) | KernelSU (kernel)
Emulação:          RootAVD + build.prop spoofing
```
