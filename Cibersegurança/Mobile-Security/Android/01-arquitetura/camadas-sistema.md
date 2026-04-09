# Camadas do Sistema Android — Nível 0 ao 4

## Nível 0 — Kernel Linux

O núcleo do sistema. Toda interação com hardware passa aqui via **syscalls**.

### O que roda aqui
- Drivers de hardware (câmera, Wi-Fi, Bluetooth, USB)
- Gerenciamento de memória (páginas, mmap, cgroups)
- Scheduler de processos
- `Binder Driver` (`/dev/binder`) — IPC do Android
- **LKM** (Loadable Kernel Modules) — código injetável no kernel em runtime
- **eBPF** — programas que rodam no espaço do kernel com segurança controlada

### Syscalls relevantes para segurança
```c
ptrace()       // controle de outro processo (debug, hooking)
mmap()         // mapear memória (injeção de código)
open/read()    // acesso a arquivos
seccomp()      // filtro de syscalls por processo
ioctl()        // comunicação com drivers (inclui /dev/binder)
```

### Ferramentas que operam aqui
| Ferramenta | Como atua |
|---|---|
| **KernelSU** | Módulo no kernel, intercepta `su` a nível de syscall |
| **LKM rootkit** | Módulo carregável que esconde processos/arquivos |
| **eBPF programs** | Monitoram syscalls sem modificar código do kernel |

---

## Nível 1 — HAL (Hardware Abstraction Layer)

Camada que traduz chamadas do framework Android para o hardware específico do fabricante.

### Exemplos de HAL
```
Camera HAL   →  /vendor/lib/hw/camera.*.so
Audio HAL    →  /vendor/lib/hw/audio.primary.*.so
Fingerprint HAL → /vendor/lib/hw/fingerprint.*.so
```

### Relevância para segurança
- Vulnerabilidades em HAL têm privilégios elevados
- Comunicação via **HIDL** (HAL Interface Definition Language) ou **AIDL**
- Acesso direto a hardware pode bypassar controles do framework

---

## Nível 2 — Native Libraries (C/C++)

Bibliotecas nativas usadas pelo framework e por apps via **NDK/JNI**.

### Bibliotecas principais
```
libc.so        // Bionic (implementação do libc do Android)
libssl.so      // OpenSSL / BoringSSL
libart.so      // Android Runtime
libdvm.so      // Dalvik (legado, pré-ART)
libandroid.so  // APIs nativas do Android
```

### JNI (Java Native Interface)
Ponte entre código Java/Kotlin e código C/C++:
```java
// Java
System.loadLibrary("minha-lib");
native String processarDados(byte[] dados);
```

```c
// C (minha-lib.c)
JNIEXPORT jstring JNICALL
Java_com_exemplo_MainActivity_processarDados(JNIEnv *env, jobject obj, jbyteArray dados) {
    // lógica nativa
}
```

### Relevância para segurança
- Código nativo **não é ofuscado** da mesma forma que bytecode Java
- Pode ser analisado com **Ghidra**, **IDA Pro**, **JADX** (parcialmente)
- RASP (Runtime Application Self-Protection) frequentemente implementado aqui
- Bibliotecas de detecção de root/frida normalmente estão nesse nível

---

## Nível 3 — Android Runtime + Framework

### ART (Android Runtime)
- Substitui o Dalvik desde Android 5.0
- Compila DEX para código nativo via **AOT** (Ahead-of-Time) ou **JIT**
- Formato de arquivo: `.dex` dentro do `.apk`

### Android Framework
Serviços do sistema acessíveis via **Binder IPC**:

| Serviço | Função |
|---|---|
| `ActivityManagerService` | Gerencia ciclo de vida de activities |
| `PackageManagerService` | Instala/lista apps e permissões |
| `WindowManagerService` | Gerencia janelas na tela |
| `TelephonyManager` | Acesso a dados do dispositivo (IMEI, operadora) |
| `LocationManager` | GPS e localização |

### Relevância para segurança
- **Hooking no framework** via Frida ou Xposed permite interceptar qualquer chamada
- `TelephonyManager.getDeviceId()` → ponto de bypass para spoofing de IMEI
- `Build.*` → ponto de spoofing para detecção de emulador

---

## Nível 4 — Aplicações

Código Java/Kotlin executado no sandbox por UID único.

### Estrutura de um APK
```
app.apk
├── AndroidManifest.xml   // permissões, componentes, configurações
├── classes.dex           // bytecode Dalvik/ART
├── classes2.dex          // (multidex)
├── resources.arsc        // recursos compilados
├── res/                  // layouts, drawables, strings
├── assets/               // arquivos brutos
└── lib/
    ├── arm64-v8a/        // bibliotecas nativas 64-bit
    └── armeabi-v7a/      // bibliotecas nativas 32-bit
```

### Componentes Android
| Componente | Descrição |
|---|---|
| **Activity** | Tela da interface do usuário |
| **Service** | Processo em background |
| **BroadcastReceiver** | Ouve eventos do sistema |
| **ContentProvider** | Compartilha dados entre apps |

### Pontos de ataque nesse nível
- Intent injection via BroadcastReceiver exposto
- Exported Activities sem validação
- ContentProvider com SQL injection
- Deeplinks malformados
- WebView com JavaScript habilitado + acesso a arquivos locais
