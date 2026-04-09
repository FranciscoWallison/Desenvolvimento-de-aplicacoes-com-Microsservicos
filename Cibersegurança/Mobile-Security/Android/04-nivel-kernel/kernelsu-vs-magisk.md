# KernelSU vs Magisk — Diferença Arquitetural

## Onde cada um opera

```
┌─────────────────────────────────────────────────────────┐
│                    ESPAÇO DO USUÁRIO                     │
│                                                          │
│   Apps (APKs)                                           │
│      ↓                                                   │
│   Android Framework                                      │
│      ↓                                                   │
│   Native Libs / ART                                      │
│      ↓                           ← Magisk opera AQUI    │
│   init / MagiskInit               (intercepta boot)     │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                    ESPAÇO DO KERNEL                      │
│                                                          │
│   Kernel Linux           ← KernelSU opera AQUI          │
│   (syscalls, drivers)     (patch no código do kernel)   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Comparação Detalhada

| Aspecto | Magisk | KernelSU |
|---|---|---|
| **Nível de operação** | Userspace (init) | Kernel (nível 0) |
| **Como concede root** | Daemon `su` no userspace | Intercepção de `execve()` no kernel |
| **Modificação do sistema** | Overlay virtual sobre `/system` | Módulos no kernel + overlay opcional |
| **Furtividade** | DenyList + Shamiko | Nativo — apps não têm visibilidade do kernel |
| **Detecção via `/proc/maps`** | Possível sem Shamiko | Muito difícil |
| **Detecção via `/proc/mounts`** | Possível sem SUSFS | Com SUSFS: invisível |
| **Módulos** | Sistema de módulos próprio | Compatível com módulos Magisk + próprios |
| **GKI (Android 12+)** | Independente | Beneficia-se de LKM mode |
| **Compilação do kernel** | Não necessária | Necessária (ou LKM mode) |
| **Maturidade** | Alta (desde 2016) | Média (desde 2022) |
| **Suporte da comunidade** | Grande | Crescente |

## Fluxo de Boot

### Magisk
```
1. Bootloader carrega boot.img (patchada pelo Magisk)
2. Kernel inicializa normalmente
3. init executa → MagiskInit intercepta antes do Android init
4. MagiskInit monta overlays em /system, /vendor, /product
5. Daemon magiskd inicia no background
6. Apps solicitam su → magiskd verifica permissão → concede
```

### KernelSU
```
1. Bootloader carrega boot.img (com kernel patchado)
2. Kernel inicializa com código KernelSU embutido
3. KernelSU registra hooks em security/selinux/hooks.c
4. init, Android framework iniciam normalmente
5. Qualquer processo que executa "su" → kernel intercepta
6. KernelSU verifica UID → se autorizado, eleva privilegio
```

## Detecção de Cada Solução

### Detectar Magisk (sem DenyList/Shamiko)
```bash
# Verificar binários
ls /sbin/.magisk/
ls /data/adb/magisk/

# Verificar processos
ps aux | grep magisk

# Verificar montagens
cat /proc/mounts | grep magisk

# Verificar propriedades
getprop | grep magisk
```

### Detectar KernelSU (muito mais difícil)
```bash
# Verificar manager instalado
pm list packages | grep kernelsu

# Verificar syscall (requer root)
# KernelSU registra uma syscall personalizada com número específico
# A presença da resposta indica KernelSU

# Verificar via /proc/version (se a build string vazar)
cat /proc/version | grep KernelSU
```

### Por que KernelSU é mais furtivo?

Apps rodam no userspace e não têm acesso direto ao kernel. Para detectar KernelSU, um app precisaria:
1. Ler `/proc/version` (acessível, mas nem sempre vaza info)
2. Tentar executar uma syscall específica do KernelSU e observar a resposta
3. Verificar se o manager app está instalado (bypassável com DenyList)

Em contraste, Magisk deixa rastros em `/proc/mounts`, `/proc/self/maps` e processos rodando no userspace — todos acessíveis por apps.

## Quando usar cada um

```
Use Magisk quando:
  - Compatibilidade máxima com módulos é necessária
  - Dispositivo não suporta compilação de kernel customizado
  - Experiência com a ferramenta é prioritária

Use KernelSU quando:
  - Máxima furtividade é necessária
  - Testando apps com detecção avançada (bancos, anti-cheat)
  - Dispositivo suporta GKI (Android 12+)
  - Pesquisando bypass de detecções a nível de kernel
```

## Uso Combinado

É possível (em alguns cenários) usar KernelSU como base e carregar módulos adicionais:

```
KernelSU → suporte base de root + LKM
  └── SUSFS (módulo LKM) → filtra /proc para apps
  └── Módulos Magisk-compatíveis → via KernelSU module system
```
