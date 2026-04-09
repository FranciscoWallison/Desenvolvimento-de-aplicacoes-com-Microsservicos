# Análise de APK — Fluxo Completo

Guia passo a passo para análise de segurança de um APK, do início ao relatório.

## Etapa 1: Coleta do APK

```bash
# Via ADB (app já instalado no dispositivo)
adb shell pm list packages | grep nome_app        # encontrar package name
adb shell pm path com.exemplo.app                 # encontrar caminho
adb pull /data/app/~~random==/com.exemplo.app-1/base.apk ./app.apk

# Via APKPure / APKMirror (download direto)

# Extrair APK de bundle (AAB) — Play Store usa AAB
bundletool build-apks --bundle=app.aab --output=app.apks
bundletool extract-apks --apks=app.apks --output-dir=./extracted
```

## Etapa 2: Informações Iniciais

```bash
# Hash do arquivo
sha256sum app.apk

# Tamanho e estrutura
unzip -l app.apk

# Conteúdo do Manifesto (sem precisar do JADX)
aapt dump badging app.apk
aapt dump permissions app.apk
```

## Etapa 3: Análise Estática com JADX

```bash
jadx -d output/ app.apk
```

**Checklist de análise:**

```
[ ] AndroidManifest.xml
    [ ] exported="true" em Activities/Services/Receivers/Providers
    [ ] debuggable="true"
    [ ] allowBackup="true"
    [ ] cleartext traffic permitido
    [ ] permissões declaradas vs usadas

[ ] Credenciais hardcoded
    [ ] API keys (grep -r "api_key\|apiKey\|secret\|password" output/)
    [ ] URLs de desenvolvimento/staging ainda presentes
    [ ] Firebase config (google-services.json dentro do APK)

[ ] Criptografia
    [ ] Algoritmos fracos (DES, RC4, MD5, SHA1 para hashing de senhas)
    [ ] ECB mode em AES
    [ ] IV ou salt fixos/hardcoded
    [ ] Chaves hardcoded no código

[ ] Armazenamento local
    [ ] SharedPreferences sem criptografia
    [ ] SQLite sem criptografia (usar SQLCipher?)
    [ ] Arquivos em /sdcard (modo_world_readable)

[ ] WebViews
    [ ] addJavascriptInterface() exposto
    [ ] setAllowFileAccess(true) + JS habilitado
    [ ] URLs carregadas sem validação

[ ] Logs de debug
    [ ] Log.d/Log.v com dados sensíveis em builds de produção
```

## Etapa 4: Análise Dinâmica

```bash
# Instalar no dispositivo
adb install app.apk

# Monitorar logs em tempo real
adb logcat | grep -E "$(adb shell ps | grep com.exemplo.app | awk '{print $2}')"

# Listar arquivos criados pelo app
adb shell run-as com.exemplo.app ls -la /data/data/com.exemplo.app/

# Conteúdo do banco de dados
adb shell run-as com.exemplo.app sqlite3 /data/data/com.exemplo.app/databases/app.db ".tables"
adb shell run-as com.exemplo.app sqlite3 /data/data/com.exemplo.app/databases/app.db "SELECT * FROM users;"

# SharedPreferences
adb shell run-as com.exemplo.app cat /data/data/com.exemplo.app/shared_prefs/*.xml
```

## Etapa 5: Análise de Tráfego

```bash
# Configurar Burp Suite como proxy (ver bypass-ssl-pinning.md)

# Após bypass de SSL pinning, capturar:
# - Endpoints da API
# - Tokens de autenticação
# - Parâmetros de requisição
# - Respostas com dados sensíveis

# Exportar histórico do Burp para análise
# Burp → Target → Site map → Save selected items
```

## Etapa 6: Testes de Componentes Expostos

```bash
# Testar Activity exported
adb shell am start -n com.exemplo.app/.InternalActivity

# Testar com Intent extras
adb shell am start -n com.exemplo.app/.DeepLinkActivity \
  -d "exemplo://reset?token=abc123"

# Testar ContentProvider
adb shell content query --uri content://com.exemplo.app.provider/users

# Testar BroadcastReceiver
adb shell am broadcast -a com.exemplo.app.CUSTOM_ACTION \
  --es "data" "payload_malicioso"
```

## Etapa 7: Bibliotecas Nativas

```bash
# Extrair .so do APK
unzip app.apk 'lib/*' -d ./libs

# Analisar com strings
strings libs/arm64-v8a/libnative.so | grep -E "http|key|pass|secret|token"

# Funções exportadas
nm -D libs/arm64-v8a/libnative.so | grep " T "

# Análise profunda: importar no Ghidra
# File → New Project → Import File → libnative.so → Auto-analyze
```

## Template de Relatório

```markdown
# Relatório de Análise de Segurança: [Nome do App]

## Informações
- Package: com.exemplo.app
- Versão: 1.2.3
- SHA256: abc123...
- Data: YYYY-MM-DD

## Vulnerabilidades Encontradas

### CRÍTICO: API Key hardcoded
- Arquivo: com/exemplo/app/network/ApiClient.java
- Linha: 42
- Valor: "sk_live_..."
- Impacto: Acesso não autorizado à API

### ALTO: Activity exportada sem validação
- Componente: com.exemplo.app.AdminActivity
- Reprodução: adb shell am start -n com.exemplo.app/.AdminActivity
- Impacto: Acesso a funcionalidades administrativas sem autenticação

### MÉDIO: Dados em SharedPreferences sem criptografia
- Arquivo: /data/data/com.exemplo.app/shared_prefs/config.xml
- Contém: access_token, user_id
- Impacto: Exposição de sessão em dispositivos com backup habilitado

## Recomendações
1. Remover chaves hardcoded — usar variáveis de ambiente via CI/CD
2. Adicionar android:exported="false" em componentes internos
3. Usar EncryptedSharedPreferences da Jetpack Security
```
