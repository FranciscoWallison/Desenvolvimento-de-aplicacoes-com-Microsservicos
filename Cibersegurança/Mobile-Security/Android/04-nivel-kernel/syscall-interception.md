# Syscall Interception — Interceptação de Chamadas de Sistema

Syscalls são a fronteira entre userspace e kernel. Interceptá-las permite monitorar ou modificar qualquer operação do sistema.

## O que são Syscalls

```
App (userspace)
    ↓  chama open("/data/file.txt")
libc (bionic)
    ↓  executa instrução `svc #0` (ARM64) / `int 0x80` (x86)
CPU muda para modo kernel
    ↓
Kernel Linux
    ↓  syscall table[__NR_openat] → do_sys_openat2()
    ↓  executa operação
    ↑  retorna resultado
App recebe o resultado
```

## Syscalls Mais Relevantes para Segurança Mobile

| Syscall | Número (ARM64) | Uso |
|---|---|---|
| `openat` | 56 | Abrir arquivos — detectar acesso a /proc |
| `execve/execveat` | 221/281 | Executar programas — detectar `su` |
| `ptrace` | 117 | Debug/injeção entre processos |
| `mmap` | 222 | Mapear memória — injeção de código |
| `read/write` | 63/64 | I/O de arquivos e sockets |
| `connect` | 203 | Conexões de rede |
| `ioctl` | 29 | Comunicação com drivers (inclui Binder) |
| `seccomp` | 277 | Filtros de syscall por processo |

## Método 1: ptrace

`ptrace` é a syscall base para debuggers. Permite a um processo controlar completamente outro.

```c
#include <sys/ptrace.h>
#include <sys/wait.h>
#include <sys/user.h>

int main() {
    pid_t pid = fork();
    
    if (pid == 0) {
        // Processo filho: permite ser tracejado
        ptrace(PTRACE_TRACEME, 0, NULL, NULL);
        execve("/system/bin/app_process", args, env);
    } else {
        // Processo pai: monitora o filho
        int status;
        struct user_regs_struct regs;
        
        while (1) {
            wait(&status);
            if (WIFEXITED(status)) break;
            
            // Parar em cada syscall
            ptrace(PTRACE_GETREGS, pid, NULL, &regs);
            
            // ARM64: x8 = número da syscall
            if (regs.regs[8] == __NR_openat) {
                // x1 = endereço do filename
                long addr = regs.regs[1];
                char filename[256];
                // Ler memória do processo tracejado
                // (via /proc/PID/mem ou PTRACE_PEEKDATA)
                printf("[ptrace] openat: %s\n", filename);
            }
            
            // Continuar até próxima syscall
            ptrace(PTRACE_SYSCALL, pid, NULL, NULL);
        }
    }
    return 0;
}
```

### Limitações do ptrace
```
- Um processo só pode ser tracejado por um tracer por vez
- Frida usa ptrace — apps que detectam ptrace bloqueiam Frida
- SELinux pode bloquear ptrace entre contextos diferentes
- Processo tracejado roda mais lento
```

### Detectar se o processo está sendo tracejado
```c
// Apps usam isso para detectar Frida/debuggers
#include <sys/ptrace.h>

int is_being_traced() {
    // Tentar se traçar — se falhar, já existe um tracer
    if (ptrace(PTRACE_TRACEME, 0, NULL, NULL) == -1) {
        return 1;  // sendo tracejado
    }
    ptrace(PTRACE_DETACH, 0, NULL, NULL);
    return 0;
}
```

```c
// Alternativa: verificar /proc/self/status
FILE *f = fopen("/proc/self/status", "r");
char line[256];
while (fgets(line, sizeof(line), f)) {
    if (strncmp(line, "TracerPid:", 10) == 0) {
        int tracer = atoi(line + 10);
        if (tracer != 0) {
            // sendo tracejado pelo PID 'tracer'
        }
    }
}
```

## Método 2: seccomp (Defesa)

`seccomp` (Secure Computing) permite que um processo instale um filtro BPF que restringe quais syscalls ele pode fazer — usado por apps para sandbox próprio.

```c
#include <linux/seccomp.h>
#include <linux/filter.h>
#include <sys/prctl.h>

// Filtro que bloqueia execve (impede execução de su)
struct sock_filter filter[] = {
    // Carregar número da syscall
    BPF_STMT(BPF_LD | BPF_W | BPF_ABS, offsetof(struct seccomp_data, nr)),
    // Se for execve, retornar EPERM
    BPF_JUMP(BPF_JMP | BPF_JEQ | BPF_K, __NR_execve, 0, 1),
    BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ERRNO | EPERM),
    // Caso contrário, permitir
    BPF_STMT(BPF_RET | BPF_K, SECCOMP_RET_ALLOW),
};

struct sock_fprog prog = {
    .len = sizeof(filter) / sizeof(filter[0]),
    .filter = filter,
};

// Instalar filtro
prctl(PR_SET_SECCOMP, SECCOMP_MODE_FILTER, &prog);
```

### O Android usa seccomp por padrão
```bash
# Verificar filtro seccomp de um processo
cat /proc/<PID>/status | grep Seccomp
# Seccomp: 2  → modo filtro ativo
# Seccomp: 0  → desabilitado

# Ver regras do filtro (requer root)
cat /proc/<PID>/seccomp_filter
```

## Método 3: /proc/PID/mem (leitura/escrita de memória)

```c
// Ler/escrever diretamente na memória de outro processo
// Mais simples que ptrace para apenas acessar memória

int mem_fd = open("/proc/1234/mem", O_RDWR);
lseek64(mem_fd, target_address, SEEK_SET);

// Ler
char buffer[256];
read(mem_fd, buffer, sizeof(buffer));

// Escrever (injeção de código/dados)
write(mem_fd, payload, payload_size);
close(mem_fd);
```

## Método 4: LD_PRELOAD (userspace, sem kernel)

Intercepta funções de biblioteca antes do carregamento — não é uma syscall, mas intercepta chamadas à libc:

```c
// hook_open.c — preloaded antes do app
#define _GNU_SOURCE
#include <dlfcn.h>
#include <stdio.h>

// Tipo da função original
typedef int (*orig_open_t)(const char *pathname, int flags, ...);

int open(const char *pathname, int flags, ...) {
    orig_open_t orig_open = dlsym(RTLD_NEXT, "open");
    
    printf("[LD_PRELOAD] open: %s\n", pathname);
    
    // Bloquear acesso a arquivos do emulador
    if (strstr(pathname, "qemu")) {
        errno = ENOENT;
        return -1;
    }
    
    return orig_open(pathname, flags);
}
```

```bash
# Compilar como .so
aarch64-linux-gnu-gcc -shared -fPIC hook_open.c -o hook_open.so -ldl

# Usar (requer root para apps com SELinux)
LD_PRELOAD=/data/local/tmp/hook_open.so /system/bin/app_process ...
```

## Comparação de Métodos

| Método | Nível | Detectável | Uso Típico |
|---|---|---|---|
| **ptrace** | Userspace | Sim (`TracerPid != 0`) | Debuggers, Frida (internamente) |
| **seccomp** | Userspace→Kernel | Não (é do próprio processo) | Sandbox de apps (defesa) |
| **eBPF kprobe** | Kernel | Não | Monitoramento silencioso |
| **LKM + syscall hook** | Kernel | Muito difícil | Rootkits, pesquisa avançada |
| **LD_PRELOAD** | Userspace | Sim (via `/proc/PID/maps`) | Protótipos rápidos de hook |
| **/proc/PID/mem** | Userspace | Possível | Leitura de memória sem ptrace |
