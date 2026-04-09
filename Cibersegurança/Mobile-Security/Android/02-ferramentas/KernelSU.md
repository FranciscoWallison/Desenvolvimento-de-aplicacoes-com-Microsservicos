# KernelSU

Solução de root que opera diretamente no **kernel Linux** (nível 0), ao contrário do Magisk que opera no userspace.

## Diferença Arquitetural vs Magisk

```
Magisk (userspace):
  init → [Magisk hooks init.rc] → monta overlays → su daemon no userspace

KernelSU (kernel):
  Kernel carregado → [patch direto no código do kernel] → su via syscall interceptada
```

A principal vantagem: apps que usam `ptrace` ou `/proc` para detectar root têm muito mais dificuldade de detectar o KernelSU porque a modificação está **antes** do userspace.

## Como o KernelSU Funciona

### 1. Patch do kernel source
KernelSU requer que o kernel seja recompilado com o patch aplicado:

```c
// KernelSU injeta código em security/selinux/hooks.c
// e em fs/exec.c para interceptar execve() do binário "su"
int ksu_handle_execveat(int *fd, struct filename **filename_ptr, ...);
```

### 2. Interceptação da syscall `execve`
Quando qualquer processo tenta executar `su`:
```
App → execve("/system/bin/su") → Kernel intercepta → KernelSU verifica UID → concede root
```

### 3. Manager App
A app do KernelSU gerencia quais UIDs têm acesso root — similar ao Magisk App.

## Módulos KernelSU

Compatível com módulos no formato Magisk (maioria funciona), além de módulos específicos:

```
susfs    → Sistema de arquivos virtual para esconder arquivos/processos no kernel
```

### SUSFS (SU Sidecar FileSystem)
Módulo de kernel que cria um layer transparente para esconder:
- Arquivos do KernelSU em `/data/adb/`
- Montagens suspeitas em `/proc/mounts`
- Processos relacionados ao root em `/proc`

```bash
# Com SUSFS, /proc/mounts do app não mostra montagens do KernelSU
# Sem SUSFS, apps podem detectar via: cat /proc/mounts | grep magisk
```

## Detecção: Magisk vs KernelSU

| Método de detecção | Magisk | KernelSU |
|---|---|---|
| Verificar `/proc/self/maps` por `magisk` | Detectável | Não detectável |
| Verificar binário `su` em `/sbin` | Detectável (sem hide) | Não detectável |
| Verificar montagens em `/proc/mounts` | Detectável | Com SUSFS: invisível |
| Usar `ptrace` no próprio processo | Detectável | Detectável (mas mais difícil) |
| Play Integrity API | Falha sem bypass | Falha sem bypass |

## Requisitos

```
- Dispositivo com bootloader desbloqueado
- Kernel compilado com patch KernelSU (GKI 2.0 = Android 12+ facilita)
- Alternativa: KernelSU com LKM mode (sem recompilar, usa módulo carregável)
```

### Modo LKM (Loadable Kernel Module)
Para kernels GKI (Generic Kernel Image) do Android 12+:

```bash
# O módulo do KernelSU pode ser carregado como .ko (kernel object)
# sem precisar recompilar o kernel completo
insmod kernelsu.ko
```

## GKI — Generic Kernel Image

Android 12+ usa GKI: um kernel base padronizado pelo Google com módulos de fabricante separados.

```
GKI (Google)     → kernel base padrão
GKI Modules      → módulos do fabricante (carregados em runtime)
KernelSU LKM     → módulo adicional carregado como .ko
```

Isso permite instalar KernelSU via boot.img sem recompilar todo o kernel.

## Instalação (dispositivos GKI)

```bash
# 1. Baixar KernelSU Manager em https://github.com/tiann/KernelSU
# 2. Obter AnyKernel3 com KernelSU patchado para seu dispositivo
# 3. Flash via fastboot ou TWRP:
fastboot flash boot kernelsu_boot.img
fastboot reboot
```
