# Emulator Spoofing — Fazer o App Acreditar que é um Dispositivo Real

Apps com proteção anti-fraude ou proteção de DRM detectam emuladores por múltiplos vetores. O objetivo do emulator spoofing é eliminar **todos** esses rastros.

## Por que Apps Detectam Emuladores

Emuladores AVD deixam rastros em:
- Propriedades de build (`Build.MODEL = "sdk_gphone64_x86_64"`)
- Ausência de sensores físicos (acelerômetro, barômetro)
- IDs genéricos (IMEI `000000000000000`, Android ID zeros)
- Interfaces de rede com nomes suspeitos (`eth0` em vez de `wlan0`)
- Processos do QEMU rodando em background
- Arquivos específicos do emulador em `/system`

## Mapa de Detecção vs Bypass

### 1. Build Properties

**Detecção:**
```java
Build.MODEL.contains("sdk") ||
Build.MODEL.contains("Emulator") ||
Build.MANUFACTURER.equals("Genymotion") ||
Build.FINGERPRINT.startsWith("generic") ||
Build.HARDWARE.equals("goldfish") ||      // AVD
Build.HARDWARE.equals("ranchu")           // AVD moderno
```

**Bypass via `build.prop`:**
```bash
# Conectar como root
adb shell su

# Editar build.prop (AVD monta como somente leitura — montar como rw)
adb shell su -c "mount -o rw,remount /system"
adb shell su -c "vi /system/build.prop"

# Substituir valores suspeitos:
ro.product.model=Pixel 7 Pro
ro.product.manufacturer=Google
ro.product.brand=google
ro.product.device=cheetah
ro.build.fingerprint=google/cheetah/cheetah:14/AP1A.240405.002/11480754:user/release-keys
ro.hardware=qcom
ro.build.type=user
ro.debuggable=0
```

**Bypass via Magisk Module (mais robusto):**
```bash
# Módulo: MagiskHide Props Config
# https://github.com/Magisk-Modules-Repo/MagiskHidePropsConf

# Instalar via Magisk Manager → Módulos
# Configurar via terminal:
adb shell su -c "props"
# Escolher fingerprint de dispositivo real da lista
```

**Bypass via Frida (runtime):**
```javascript
Java.perform(() => {
    const Build = Java.use('android.os.Build');
    Build.MODEL.value = 'Pixel 7 Pro';
    Build.MANUFACTURER.value = 'Google';
    Build.FINGERPRINT.value = 'google/cheetah/cheetah:14/AP1A.240405.002/11480754:user/release-keys';
    Build.HARDWARE.value = 'qcom';
    Build.BRAND.value = 'google';
    Build.DEVICE.value = 'cheetah';
    Build.PRODUCT.value = 'cheetah';
    
    console.log('[*] Build properties spoofadas');
});
```

---

### 2. IMEI e Identificadores de Dispositivo

**Detecção:**
```java
TelephonyManager tm = (TelephonyManager) getSystemService(TELEPHONY_SERVICE);
String imei = tm.getDeviceId();        // "000000000000000" no emulador
String imsi = tm.getSubscriberId();    // null no emulador
String line1 = tm.getLine1Number();    // "+15555215554" (número falso do AVD)
```

**Bypass via Frida:**
```javascript
Java.perform(() => {
    const TelephonyManager = Java.use('android.telephony.TelephonyManager');

    TelephonyManager.getDeviceId.overload().implementation = function() {
        return '358240051111110';   // IMEI válido
    };

    TelephonyManager.getSubscriberId.overload().implementation = function() {
        return '724060000000001';   // IMSI válido
    };

    TelephonyManager.getLine1Number.overload().implementation = function() {
        return '+5511999999999';
    };
    
    console.log('[*] TelephonyManager spoofado');
});
```

---

### 3. Android ID e Identificadores de Usuário

**Detecção:**
```java
String androidId = Settings.Secure.getString(
    getContentResolver(), Settings.Secure.ANDROID_ID
);
// No emulador: "9774d56d682e549c" (valor padrão genérico)
```

**Bypass via Frida:**
```javascript
Java.perform(() => {
    const Secure = Java.use('android.provider.Settings$Secure');

    Secure.getString.overload('android.content.ContentResolver', 'java.lang.String')
        .implementation = function(resolver, name) {
        if (name === 'android_id') {
            return 'a1b2c3d4e5f60718';  // Android ID de 16 chars hex
        }
        return this.getString(resolver, name);
    };
});
```

---

### 4. Sensores Físicos

**Detecção:**
```java
SensorManager sm = (SensorManager) getSystemService(SENSOR_SERVICE);
List<Sensor> sensors = sm.getSensorList(Sensor.TYPE_ALL);
// Emuladores têm 0 ou poucos sensores, sem barômetro, sem sensor de passos
```

**Bypass:** Emuladores AVD modernos simulam acelerômetro e giroscópio. Para sensores adicionais, usar **Extended Controls** do emulador para simular dados:

```bash
# Via telnet ao emulador
telnet localhost 5554
auth <token_do_~/.emulator_console_auth_token>
sensor set acceleration 0.1:9.8:0.1   # simular movimento leve
sensor set magnetic-field 22.4:6.1:42.8
```

---

### 5. Interfaces de Rede

**Detecção:**
```java
// Emuladores usam eth0, dispositivos reais usam wlan0
NetworkInterface ni = NetworkInterface.getByName("eth0");
if (ni != null) { /* é emulador */ }
```

**Bypass via Frida:**
```javascript
Java.perform(() => {
    const NetworkInterface = Java.use('java.net.NetworkInterface');

    NetworkInterface.getByName.implementation = function(name) {
        if (name === 'wlan0') {
            // Retornar interface eth0 como se fosse wlan0
            return this.getByName('eth0');
        }
        return this.getByName(name);
    };
});
```

---

### 6. Arquivos Específicos do Emulador

**Detecção:**
```java
String[] emulatorFiles = {
    "/dev/socket/qemud",
    "/dev/qemu_pipe",
    "/system/lib/libc_malloc_debug_qemu.so",
    "/sys/qemu_trace",
    "/system/bin/qemu-props"
};

for (String file : emulatorFiles) {
    if (new File(file).exists()) { /* emulador detectado */ }
}
```

**Bypass via Magisk Module:**
```bash
# Criar módulo que remove/esconde esses arquivos via overlay
# /data/adb/modules/anti-emulator-detect/
# └── system/
#     └── [arquivos vazios para sobrescrever os originais]
```

**Bypass via Frida:**
```javascript
Java.perform(() => {
    const File = Java.use('java.io.File');
    const emulatorPaths = [
        '/dev/socket/qemud', '/dev/qemu_pipe',
        '/system/lib/libc_malloc_debug_qemu.so'
    ];

    File.exists.implementation = function() {
        if (emulatorPaths.includes(this.getAbsolutePath())) {
            console.log('[*] Escondendo: ' + this.getAbsolutePath());
            return false;
        }
        return this.exists();
    };
});
```

---

## Script Completo: Anti-Emulator-Detection

```javascript
// anti-emulator.js — hook tudo de uma vez
Java.perform(() => {
    // Build properties
    const Build = Java.use('android.os.Build');
    Build.MODEL.value = 'Pixel 7 Pro';
    Build.MANUFACTURER.value = 'Google';
    Build.BRAND.value = 'google';
    Build.DEVICE.value = 'cheetah';
    Build.PRODUCT.value = 'cheetah';
    Build.HARDWARE.value = 'qcom';
    Build.FINGERPRINT.value = 'google/cheetah/cheetah:14/AP1A.240405.002/11480754:user/release-keys';

    // IMEI
    const TM = Java.use('android.telephony.TelephonyManager');
    TM.getDeviceId.overload().implementation = () => '358240051111110';
    TM.getSubscriberId.overload().implementation = () => '724060000000001';

    // Android ID
    const Secure = Java.use('android.provider.Settings$Secure');
    Secure.getString.overload('android.content.ContentResolver', 'java.lang.String')
        .implementation = function(r, name) {
        if (name === 'android_id') return 'a1b2c3d4e5f60718';
        return this.getString(r, name);
    };

    // Arquivos de emulador
    const File = Java.use('java.io.File');
    const emulatorPaths = ['/dev/socket/qemud', '/dev/qemu_pipe'];
    File.exists.implementation = function() {
        if (emulatorPaths.includes(this.getAbsolutePath())) return false;
        return this.exists();
    };

    console.log('[*] Emulator spoofing ativo');
});
```

```bash
# Executar:
frida -U -f com.exemplo.app -l anti-emulator.js --no-pause
```
