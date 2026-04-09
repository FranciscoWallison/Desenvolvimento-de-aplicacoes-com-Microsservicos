# LKM — Loadable Kernel Modules no Android

LKMs são pedaços de código que podem ser carregados e descarregados do kernel Linux em runtime, sem reinicialização. No Android, são a base do KernelSU no modo LKM e de técnicas avançadas de análise.

## Conceitos Fundamentais

```c
// Estrutura mínima de um módulo
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Pesquisador");
MODULE_DESCRIPTION("Módulo de exemplo");

static int __init meu_modulo_init(void) {
    printk(KERN_INFO "[meu_modulo] Carregado\n");
    return 0;
}

static void __exit meu_modulo_exit(void) {
    printk(KERN_INFO "[meu_modulo] Descarregado\n");
}

module_init(meu_modulo_init);
module_exit(meu_modulo_exit);
```

```bash
# Compilar
make -C /path/to/kernel M=$(pwd) modules

# Carregar
insmod meu_modulo.ko

# Verificar se carregou
lsmod | grep meu_modulo
dmesg | tail -5

# Descarregar
rmmod meu_modulo
```

## GKI e LKMs no Android

O Android 12+ usa **GKI (Generic Kernel Image)**, que separa o kernel base (mantido pelo Google) dos módulos de fabricante. Isso permite carregar LKMs sem recompilar o kernel inteiro.

```
GKI Kernel (boot.img)
    └── Interface KMI (Kernel Module Interface)
            └── Módulos de fabricante (.ko)
            └── KernelSU.ko
            └── SUSFS.ko
            └── seus-módulos.ko
```

### Verificar suporte a LKM
```bash
# No dispositivo
cat /proc/version         # verificar versão do kernel
cat /sys/module/*/version # módulos carregados

# Verificar se CONFIG_MODULES está habilitado
zcat /proc/config.gz | grep CONFIG_MODULES
# CONFIG_MODULES=y → suporta LKM
```

## Hook de Syscalls via LKM

Uma das técnicas mais poderosas: interceptar syscalls diretamente na tabela do kernel.

```c
#include <linux/module.h>
#include <linux/syscalls.h>
#include <linux/kallsyms.h>
#include <linux/uaccess.h>

// Ponteiro para a syscall table original
static unsigned long *syscall_table;

// Tipos das syscalls originais
typedef asmlinkage long (*orig_openat_t)(int, const char __user *, int, umode_t);
static orig_openat_t orig_openat;

// Nossa versão do openat
asmlinkage long hook_openat(int dfd, const char __user *filename, int flags, umode_t mode) {
    char path[256];
    if (copy_from_user(path, filename, sizeof(path)) == 0) {
        // Esconder arquivos relacionados ao root
        if (strstr(path, "magisk") || strstr(path, "kernelsu")) {
            printk(KERN_INFO "[hook] Bloqueando acesso a: %s\n", path);
            return -ENOENT;  // simular "arquivo não encontrado"
        }
    }
    return orig_openat(dfd, filename, flags, mode);
}

// Desabilitar write protection da syscall table
static void disable_write_protection(void) {
    unsigned long cr0 = read_cr0();
    write_cr0(cr0 & ~(1 << 16));  // Clear WP bit
}

static void enable_write_protection(void) {
    unsigned long cr0 = read_cr0();
    write_cr0(cr0 | (1 << 16));
}

static int __init hook_init(void) {
    syscall_table = (unsigned long *)kallsyms_lookup_name("sys_call_table");
    if (!syscall_table) {
        printk(KERN_ERR "[hook] Não foi possível encontrar syscall table\n");
        return -1;
    }
    
    orig_openat = (orig_openat_t)syscall_table[__NR_openat];
    
    disable_write_protection();
    syscall_table[__NR_openat] = (unsigned long)hook_openat;
    enable_write_protection();
    
    printk(KERN_INFO "[hook] openat() hookado\n");
    return 0;
}

static void __exit hook_exit(void) {
    disable_write_protection();
    syscall_table[__NR_openat] = (unsigned long)orig_openat;
    enable_write_protection();
    printk(KERN_INFO "[hook] openat() restaurado\n");
}
```

> **Nota:** Em kernels modernos com KASLR e kallsyms restrito, encontrar o endereço da syscall table requer técnicas adicionais.

## Monitorar Processos via LKM

```c
// Hook no task_struct para monitorar criação de processos
#include <linux/kprobes.h>

static int handler_pre(struct kprobe *p, struct pt_regs *regs) {
    printk(KERN_INFO "[monitor] Novo processo: %s (PID: %d)\n",
           current->comm, current->pid);
    return 0;
}

static struct kprobe kp = {
    .symbol_name = "wake_up_new_task",  // chamado ao criar novo processo
    .pre_handler = handler_pre,
};

static int __init monitor_init(void) {
    register_kprobe(&kp);
    return 0;
}
```

## kprobes — Alternativa Mais Segura

`kprobes` é a API oficial do Linux para instrumentação do kernel sem modificar o código diretamente:

```c
#include <linux/kprobes.h>

// Hook em função do kernel via nome
static struct kprobe kp = {
    .symbol_name = "do_sys_openat2",
};

static int handler_pre(struct kprobe *p, struct pt_regs *regs) {
    // regs contém argumentos da função
    const char __user *filename = (const char __user *)regs->si;
    char buf[256];
    strncpy_from_user(buf, filename, sizeof(buf));
    printk(KERN_INFO "[kprobe] open: %s\n", buf);
    return 0;
}

kp.pre_handler = handler_pre;
register_kprobe(&kp);
```

Vantagens: não precisa desabilitar write protection, suportado oficialmente, mais seguro.

## Compilação Cross para ARM64

```bash
# Instalar toolchain
sudo apt install gcc-aarch64-linux-gnu

# Makefile
KERNEL_DIR := /caminho/para/android-kernel-source
CROSS_COMPILE := aarch64-linux-gnu-
ARCH := arm64

obj-m += meu_modulo.o

all:
	make -C $(KERNEL_DIR) M=$(PWD) ARCH=$(ARCH) CROSS_COMPILE=$(CROSS_COMPILE) modules

clean:
	make -C $(KERNEL_DIR) M=$(PWD) clean

# Compilar
make
# Gera: meu_modulo.ko
```

## Segurança: o que o kernel protege

```
KASLR  → randomiza endereço base do kernel (torna ROP e endereços hardcoded inúteis)
CFI    → Control Flow Integrity (Android 12+) — impede desvios arbitrários de fluxo
SELinux→ política separa o que módulos podem fazer
KGDB   → debugger do kernel (geralmente desabilitado em produção)
```
