# JADX

Decompilador de APK que converte bytecode DEX em código Java/Kotlin legível. Principal ferramenta de análise estática para Android.

Repositório: https://github.com/skylot/jadx

## Instalação

```bash
# Via release (recomendado)
# https://github.com/skylot/jadx/releases
# Baixar jadx-X.X.X.zip, extrair e executar

# Linux/Mac
./bin/jadx-gui      # interface gráfica
./bin/jadx          # linha de comando

# Windows
bin\jadx-gui.bat
```

## Uso Básico

```bash
# Decompiliar APK para diretório
jadx -d output/ app.apk

# Decompiliar com recursos
jadx -d output/ --show-bad-code app.apk

# Apenas classes (sem recursos)
jadx -d output/ --no-res app.apk

# Exportar como projeto Gradle (abre no Android Studio)
jadx -d output/ --export-gradle app.apk
```

## O que Analisar

### 1. AndroidManifest.xml
```xml
<!-- Buscar por: -->
android:exported="true"          <!-- componente acessível externamente -->
android:debuggable="true"        <!-- app em modo debug -->
android:allowBackup="true"       <!-- dados backupeáveis pelo ADB -->
android:usesCleartextTraffic="true" <!-- HTTP sem criptografia -->

<!-- Permissões perigosas declaradas -->
<uses-permission android:name="android.permission.READ_CONTACTS"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
```

### 2. Strings hardcoded
```bash
# Via linha de comando — buscar segredos
grep -r "api_key\|apiKey\|secret\|password\|token\|Bearer" output/

# Padrões comuns de chaves expostas
grep -r "sk_live\|pk_live" output/          # Stripe
grep -r "AKIA" output/                       # AWS Access Key
grep -r "AIza" output/                       # Google API Key
grep -r "-----BEGIN" output/                 # Chaves privadas
```

### 3. Comunicação de rede
```java
// Procurar por implementações de OkHttp, Retrofit, Volley
// Buscar: "http://", endpoints hardcoded
// Buscar: certificados pinados (CertificatePinner, TrustManager customizado)
```

### 4. Armazenamento de dados sensíveis
```java
// SharedPreferences sem criptografia
getSharedPreferences("config", MODE_PRIVATE).getString("token", "")

// SQLite sem criptografia
SQLiteDatabase db = openOrCreateDatabase("users.db", MODE_PRIVATE, null);

// Arquivos em /sdcard (acessíveis por outros apps)
new File(Environment.getExternalStorageDirectory(), "dados.txt")
```

### 5. Criptografia fraca
```java
// Algoritmos obsoletos/inseguros
Cipher.getInstance("DES")          // DES - inseguro
Cipher.getInstance("AES/ECB/...")  // ECB - não use
MessageDigest.getInstance("MD5")   // MD5 para senhas - inseguro
MessageDigest.getInstance("SHA1")  // SHA1 - depreciado
```

## Dicas de Navegação no JADX-GUI

```
Ctrl+F          → busca no arquivo atual
Ctrl+Shift+F    → busca em todos os arquivos
Ctrl+N          → ir para classe pelo nome
Ctrl+Click      → navegar para definição
F5              → atualizar decompilação
```

## Limitações

```
✗ Código nativo (.so) não é decompilado — usar Ghidra para isso
✗ Obfuscação por ProGuard/R8 dificulta a leitura (classes viram a.b.c)
✗ Strings criptografadas em runtime não aparecem
✓ Recursos (XML, imagens) são extraídos sem problemas
✓ Manifesto é sempre legível mesmo com obfuscação
```

## Contornar Obfuscação

```bash
# Verificar se há mapeamento ProGuard incluído no APK
unzip -l app.apk | grep mapping

# Reapply mapping com jadx
jadx --deobf app.apk -d output/

# Renomear manualmente pelo contexto
# Ex: classe "a.b.c" que acessa "getDeviceId()" → provavelmente é DeviceInfoHelper
```
