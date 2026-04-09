# eBPF no Android

eBPF (extended Berkeley Packet Filter) permite rodar programas verificados dentro do kernel Linux sem modificá-lo, com segurança controlada. No Android, é usado pelo próprio sistema para coleta de métricas de rede e CPU.

## O que é eBPF

```
Programa eBPF (C restrito)
    → compilado para bytecode eBPF
    → verificado pelo kernel (verifier garante segurança)
    → executado no contexto do kernel em eventos específicos
    → resultados lidos pelo userspace via maps
```

Diferente de LKM (código arbitrário no kernel), o eBPF passa por um verificador que garante que o programa não travará o kernel, não acessará memória inválida e terminará em tempo finito.

## Suporte no Android

| Versão Android | Suporte eBPF |
|---|---|
| Android 9 (Pie) | Introduzido — uso interno para netstats |
| Android 10 | Expandido para VPN e bandwidth |
| Android 12 | GKI com eBPF estável, suporte a CO-RE |
| Android 14+ | eBPF como plataforma de observabilidade |

## Tipos de Programas eBPF Úteis para Segurança

| Tipo | Hook Point | Uso |
|---|---|---|
| `kprobe` | Entrada de função do kernel | Monitorar syscalls |
| `kretprobe` | Saída de função do kernel | Capturar valor de retorno |
| `tracepoint` | Eventos estáticos do kernel | Monitorar eventos documentados |
| `perf_event` | Eventos de hardware/software | Profiling |
| `socket filter` | Pacotes de rede | Filtrar/capturar tráfego |
| `tc` (traffic control) | Fila de rede | Inspecionar/modificar pacotes |

## Programa eBPF: Monitorar `openat` via kprobe

```c
// monitor_openat.bpf.c
#include <linux/bpf.h>
#include <linux/ptrace.h>
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_tracing.h>

// Map para armazenar eventos (ring buffer)
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 256 * 1024);
} events SEC(".maps");

struct event {
    __u32 pid;
    char comm[16];
    char filename[256];
};

SEC("kprobe/do_sys_openat2")
int BPF_KPROBE(trace_openat, int dfd, const char __user *filename) {
    struct event *e;
    
    e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
    if (!e) return 0;
    
    e->pid = bpf_get_current_pid_tgid() >> 32;
    bpf_get_current_comm(&e->comm, sizeof(e->comm));
    bpf_probe_read_user_str(&e->filename, sizeof(e->filename), filename);
    
    bpf_ringbuf_submit(e, 0);
    return 0;
}

char LICENSE[] SEC("license") = "GPL";
```

```c
// monitor_openat.c — userspace loader
#include <bpf/libbpf.h>
#include <stdio.h>

int main() {
    struct monitor_openat_bpf *skel;
    
    skel = monitor_openat_bpf__open_and_load();
    monitor_openat_bpf__attach(skel);
    
    // Processar eventos do ring buffer
    struct ring_buffer *rb = ring_buffer__new(
        bpf_map__fd(skel->maps.events),
        handle_event, NULL, NULL
    );
    
    while (1) ring_buffer__poll(rb, 100);
    return 0;
}
```

## eBPF com bcc (BPF Compiler Collection)

`bcc` é uma toolkit Python que simplifica a escrita de programas eBPF:

```python
# monitor_syscalls.py
from bcc import BPF

program = """
#include <uapi/linux/ptrace.h>

int trace_open(struct pt_regs *ctx, int dfd, const char __user *filename) {
    char fname[256];
    bpf_probe_read_user_str(fname, sizeof(fname), filename);
    
    // Filtrar por processo específico
    u32 pid = bpf_get_current_pid_tgid() >> 32;
    bpf_trace_printk("PID %d abriu: %s\\n", pid, fname);
    return 0;
}
"""

b = BPF(text=program)
b.attach_kprobe(event="do_sys_openat2", fn_name="trace_open")

print("Monitorando openat()... Ctrl+C para parar")
b.trace_print()
```

```bash
# Instalar bcc no dispositivo (via Termux com root)
pkg install python
pip install bcc

# Rodar
python monitor_syscalls.py
```

## Monitorar Tráfego de Rede com eBPF

```c
// Filtro de socket — captura pacotes de um processo específico
SEC("socket")
int socket_filter(struct __sk_buff *skb) {
    __u32 pid = bpf_get_current_pid_tgid() >> 32;
    
    // Só passar pacotes do PID alvo
    if (pid == TARGET_PID) {
        return -1;  // capturar
    }
    return 0;  // descartar do filtro
}
```

## eBPF para Detectar Comportamento Suspeito (Defesa)

```c
// Detectar injeção de código via ptrace
SEC("tracepoint/syscalls/sys_enter_ptrace")
int detect_ptrace(struct trace_event_raw_sys_enter *ctx) {
    long request = ctx->args[0];
    
    // PTRACE_POKETEXT e PTRACE_POKEDATA escrevem em memória de outro processo
    if (request == PTRACE_POKETEXT || request == PTRACE_POKEDATA) {
        u32 pid = bpf_get_current_pid_tgid() >> 32;
        char comm[16];
        bpf_get_current_comm(comm, sizeof(comm));
        
        bpf_printk("ALERTA: %s (PID %d) tentou injetar código via ptrace!\n",
                   comm, pid);
    }
    return 0;
}
```

## Comparação: eBPF vs LKM vs Frida

| Aspecto | eBPF | LKM | Frida |
|---|---|---|---|
| **Nível** | Kernel (seguro) | Kernel (irrestrito) | Userspace |
| **Segurança** | Verificado pelo kernel | Código arbitrário | Sandboxado |
| **Persistência** | Enquanto processo carregador roda | Enquanto módulo carregado | Sessão Frida |
| **Risco de crash** | Muito baixo | Alto | Nenhum para o kernel |
| **Visibilidade por apps** | Invisível | Invisível | Detectável via /proc/maps |
| **Complexidade** | Média | Alta | Baixa (JS) |
| **Modificar comportamento** | Limitado | Total | Total (userspace) |
| **Ideal para** | Monitoramento e análise | Controle total / rootkit | Bypass em runtime |
