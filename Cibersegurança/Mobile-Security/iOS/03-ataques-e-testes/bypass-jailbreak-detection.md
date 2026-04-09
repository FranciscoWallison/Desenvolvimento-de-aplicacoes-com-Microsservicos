# Bypass de Jailbreak Detection no iOS

## Métodos de Detecção Comuns

### 1. Verificação de Arquivos do Jailbreak

```swift
// Swift
let jailbreakFiles = [
    "/Applications/Cydia.app",
    "/Library/MobileSubstrate/MobileSubstrate.dylib",
    "/bin/bash",
    "/usr/sbin/sshd",
    "/etc/apt",
    "/private/var/lib/apt/",
    "/usr/bin/ssh",
    "/private/var/stash"
]

for path in jailbreakFiles {
    if FileManager.default.fileExists(atPath: path) {
        // jailbreak detectado
    }
}
```

**Bypass via Objection:**
```bash
ios jailbreak disable
```

**Bypass via Frida:**
```javascript
// Hook no FileManager
const FileManager = ObjC.classes.NSFileManager;

Interceptor.attach(
    FileManager['- fileExistsAtPath:'].implementation,
    {
        onEnter(args) {
            const path = new ObjC.Object(args[2]).toString();
            this.path = path;
        },
        onLeave(retval) {
            const jbPaths = [
                '/Applications/Cydia.app', '/bin/bash',
                '/usr/sbin/sshd', '/etc/apt',
                '/Library/MobileSubstrate'
            ];
            if (jbPaths.some(p => this.path.includes(p))) {
                console.log('[JB] Bloqueando fileExists para: ' + this.path);
                retval.replace(ptr(0));  // retornar false
            }
        }
    }
);
```

---

### 2. Verificação de Apps do Jailbreak

```swift
// Verificar se Cydia pode ser aberto via URL scheme
if UIApplication.shared.canOpenURL(URL(string: "cydia://")!) {
    // jailbreak detectado
}
```

**Bypass via Frida:**
```javascript
const UIApplication = ObjC.classes.UIApplication;

Interceptor.attach(
    UIApplication['- canOpenURL:'].implementation,
    {
        onEnter(args) {
            const url = new ObjC.Object(args[2]).absoluteString().toString();
            this.url = url;
        },
        onLeave(retval) {
            const jbSchemes = ['cydia://', 'sileo://', 'zbra://'];
            if (jbSchemes.some(s => this.url.startsWith(s))) {
                console.log('[JB] Bloqueando canOpenURL: ' + this.url);
                retval.replace(ptr(0));
            }
        }
    }
);
```

---

### 3. Sandbox Escape Test

```swift
// Apps com sandbox não conseguem escrever fora do container
let testPath = "/private/jailbreak_test_\(UUID().uuidString)"
do {
    try "test".write(toFile: testPath, atomically: true, encoding: .utf8)
    try FileManager.default.removeItem(atPath: testPath)
    // conseguiu escrever = jailbreak
} catch {
    // sandbox intacta
}
```

**Bypass via Frida:**
```javascript
// Hook no open() para bloquear escritas fora do container
const openPtr = Module.findExportByName(null, 'open');
Interceptor.attach(openPtr, {
    onEnter(args) {
        const path = args[0].readUtf8String();
        if (path && path.startsWith('/private/jailbreak_test_')) {
            console.log('[JB] Bloqueando sandbox escape test');
            args[0] = Memory.allocUtf8String('/dev/null');
        }
    }
});
```

---

### 4. Verificação de dylibs Suspeitas

```swift
// Listar dylibs carregadas e procurar as do jailbreak
let imageCount = _dyld_image_count()
for i in 0..<imageCount {
    if let name = _dyld_get_image_name(i) {
        let path = String(cString: name)
        if path.contains("MobileSubstrate") || path.contains("TweakInject") {
            // jailbreak detectado
        }
    }
}
```

**Bypass via Frida:**
```javascript
// Hook no _dyld_get_image_name
const dyldGetImageName = Module.findExportByName(null, '_dyld_get_image_name');
Interceptor.replace(dyldGetImageName, new NativeCallback(
    function(imageIndex) {
        const name = dyldGetImageName(imageIndex).readUtf8String();
        const jbLibs = ['MobileSubstrate', 'TweakInject', 'substrate'];
        if (name && jbLibs.some(l => name.includes(l))) {
            return Memory.allocUtf8String('/usr/lib/system/libsystem_kernel.dylib');
        }
        return dyldGetImageName(imageIndex);
    },
    'pointer', ['uint']
));
```

---

## Script Consolidado: iOS Jailbreak Bypass

```javascript
// ios-jb-bypass.js
ObjC.schedule(ObjC.mainQueue, () => {
    // 1. FileManager
    const FileManager = ObjC.classes.NSFileManager;
    const jbPaths = [
        '/Applications/Cydia.app', '/bin/bash', '/usr/sbin/sshd',
        '/etc/apt', '/Library/MobileSubstrate', '/private/var/lib/apt'
    ];
    
    Interceptor.attach(FileManager['- fileExistsAtPath:'].implementation, {
        onEnter(args) { this.path = new ObjC.Object(args[2]).toString(); },
        onLeave(retval) {
            if (jbPaths.some(p => this.path.startsWith(p)))
                retval.replace(ptr(0));
        }
    });

    // 2. URL schemes
    const UIApp = ObjC.classes.UIApplication;
    const jbSchemes = ['cydia://', 'sileo://', 'zbra://'];
    Interceptor.attach(UIApp['- canOpenURL:'].implementation, {
        onEnter(args) { this.url = new ObjC.Object(args[2]).absoluteString().toString(); },
        onLeave(retval) {
            if (jbSchemes.some(s => this.url.startsWith(s)))
                retval.replace(ptr(0));
        }
    });

    console.log('[*] iOS Jailbreak bypass ativo');
});
```

```bash
frida -U -f "com.banco.ios" -l ios-jb-bypass.js --no-pause
```
