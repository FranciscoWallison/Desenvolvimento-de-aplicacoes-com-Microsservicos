# Nível Kernel — Android (Nível 0)

Operação diretamente no kernel Linux que sustenta o Android. Este é o nível mais baixo acessível sem modificar hardware.

## Tópicos

| Arquivo | Descrição |
|---|---|
| [kernelsu-vs-magisk.md](./kernelsu-vs-magisk.md) | Diferença arquitetural entre as soluções de root |
| [lkm-android.md](./lkm-android.md) | Loadable Kernel Modules — injetar código no kernel |
| [ebpf-android.md](./ebpf-android.md) | eBPF — monitorar syscalls sem modificar o kernel |
| [syscall-interception.md](./syscall-interception.md) | Interceptar chamadas de sistema via ptrace, seccomp |

## Por que estudar nível kernel?

```
Userspace (níveis 1-4):
  - Frida, Magisk, análise de APK
  - Detectável por apps com proteção avançada
  - Limitado por SELinux e sandbox

Kernel (nível 0):
  - Controle total sobre o sistema
  - Invisível para apps — eles não têm acesso ao kernel
  - Bypass de detecções que verificam /proc, /sys, /dev
  - Base para rootkits, análise de malware avançada e RASP bypass total
```

## Pré-requisitos

```
- Dispositivo com bootloader desbloqueado
- KernelSU instalado (ou Magisk com módulos de kernel)
- Para LKM: compilador cross-compilation para ARM64
- Para eBPF: Android 12+ (suporte nativo melhorado)
- Conhecimento básico de C e Linux kernel API
```
