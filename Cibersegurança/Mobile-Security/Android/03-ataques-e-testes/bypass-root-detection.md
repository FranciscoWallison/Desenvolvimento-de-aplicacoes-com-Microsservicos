# Bypass de Root Detection

Apps com segurança elevada (bancários, DRM, jogos anti-cheat) implementam múltiplas camadas de detecção de root. Cada camada precisa ser endereçada.

## Métodos de Detecção Comuns

### 1. Verificação de Binários `su`

```java
String[] suPaths = {
    "/system/bin/su", "/system/xbin/su", "/sbin/su",
    "/data/local/su", "/data/local/xbin/su",
    "/su/bin/su", "/magisk/.core/bin/su"
};

for (String path : suPaths) {
    if (new File(path).exists()) { /* rooted */ }
}
```

**Bypass (Magisk DenyList):**
```
Magisk App → Configurações → Zygisk: ON
Magisk App → DenyList → adicionar o app
```

**Bypass (Frida):**
```javascript
Java.perform(() => {
    const File = Java.use('java.io.File');
    const suPaths = ['/system/bin/su', '/system/xbin/su', '/sbin/su',
                     '/su/bin/su', '/data/local/su'];
    File.exists.implementation = function() {
        if (suPaths.includes(this.getAbsolutePath())) return false;
        return this.exists();
    };
});
```

---

### 2. Verificação de Apps Instalados

```java
PackageManager pm = getPackageManager();
String[] rootApps = {
    "com.topjohnwu.magisk",
    "eu.chainfire.supersu",
    "com.koushikdutta.superuser",
    "com.noshufou.android.su",
    "com.thirdparty.superuser"
};
for (String pkg : rootApps) {
    try {
        pm.getPackageInfo(pkg, 0);
        // app instalado = rooted
    } catch (PackageManager.NameNotFoundException e) {}
}
```

**Bypass (Magisk):** DenyList esconde o Magisk da lista de pacotes para apps específicos.

**Bypass (Frida):**
```javascript
Java.perform(() => {
    const PackageManager = Java.use('android.app.ApplicationPackageManager');
    const rootPkgs = ['com.topjohnwu.magisk', 'eu.chainfire.supersu'];

    PackageManager.getPackageInfo.overload('java.lang.String', 'int')
        .implementation = function(pkg, flags) {
        if (rootPkgs.includes(pkg)) {
            throw Java.use('android.content.pm.PackageManager$NameNotFoundException')
                .$new(pkg);
        }
        return this.getPackageInfo(pkg, flags);
    };
});
```

---

### 3. Execução de Comando `su`

```java
try {
    Process proc = Runtime.getRuntime().exec(new String[]{"su", "-c", "id"});
    // Se não lançar exceção, root existe
} catch (IOException e) {
    // Sem root
}
```

**Bypass (Frida):**
```javascript
Java.perform(() => {
    const Runtime = Java.use('java.lang.Runtime');

    Runtime.exec.overload('[Ljava.lang.String;').implementation = function(cmds) {
        if (cmds.length > 0 && cmds[0] === 'su') {
            console.log('[*] Bloqueando exec de su');
            throw Java.use('java.io.IOException').$new('Permission denied');
        }
        return this.exec(cmds);
    };
});
```

---

### 4. Verificação de `/proc/mounts`

```java
BufferedReader reader = new BufferedReader(new FileReader("/proc/mounts"));
String line;
while ((line = reader.readLine()) != null) {
    if (line.contains("magisk") || line.contains("core/mirror")) {
        // root detectado
    }
}
```

**Bypass:** Usar **SUSFS** (módulo KernelSU) que filtra entradas suspeitas diretamente no kernel, tornando o `/proc/mounts` transparente.

---

### 5. Verificação de RW em `/system`

```java
File systemDir = new File("/system");
if (systemDir.canWrite()) { /* root */ }

// OU verificar montagem
StatFs stat = new StatFs("/system");
// Em dispositivos não-rootados, /system é sempre ro
```

---

### 6. SafetyNet / Play Integrity (nível mais difícil)

Ver [Magisk.md](../02-ferramentas/Magisk.md#safetynet--play-integrity) para bypass completo.

```bash
# Resumo do bypass atual:
# 1. Magisk + Zygisk ativado
# 2. Módulo PlayIntegrityFix instalado
# 3. App na DenyList + Shamiko
# 4. Verificar: https://play.google.com/store/apps/details?id=gr.nikolasspyr.integritycheck
```

---

## Script Consolidado

```javascript
// bypass-root-detection.js
Java.perform(() => {
    const File = Java.use('java.io.File');
    const Runtime = Java.use('java.lang.Runtime');
    const PackageManager = Java.use('android.app.ApplicationPackageManager');

    const rootFiles = [
        '/system/bin/su', '/system/xbin/su', '/sbin/su',
        '/su/bin/su', '/data/local/su', '/magisk'
    ];
    const rootPkgs = [
        'com.topjohnwu.magisk', 'eu.chainfire.supersu',
        'com.koushikdutta.superuser', 'com.noshufou.android.su'
    ];

    File.exists.implementation = function() {
        if (rootFiles.some(p => this.getAbsolutePath().startsWith(p))) return false;
        return this.exists();
    };

    Runtime.exec.overload('[Ljava.lang.String;').implementation = function(cmds) {
        if (cmds[0] === 'su') throw Java.use('java.io.IOException').$new('denied');
        return this.exec(cmds);
    };

    PackageManager.getPackageInfo.overload('java.lang.String', 'int')
        .implementation = function(pkg, flags) {
        if (rootPkgs.includes(pkg))
            throw Java.use('android.content.pm.PackageManager$NameNotFoundException').$new(pkg);
        return this.getPackageInfo(pkg, flags);
    };

    console.log('[*] Root detection bypass ativo');
});
```

```bash
frida -U -f com.banco.app -l bypass-root-detection.js --no-pause
```

## Ordem de Ataque Recomendada

```
1. Objection → android root disable          (tentativa rápida)
2. Magisk DenyList + Shamiko                  (se o app usa Play Integrity)
3. Frida script customizado                   (se as opções acima falharem)
4. KernelSU + SUSFS                           (detecções a nível de /proc)
5. Análise estática (JADX) para encontrar    
   a classe exata de detecção e criar hook   
   cirúrgico                                  (máxima precisão)
```
