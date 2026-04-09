# MobSF — Mobile Security Framework

Framework completo de análise de segurança mobile que automatiza análise estática e dinâmica de APKs (Android) e IPAs (iOS).

Repositório: https://github.com/MobSF/Mobile-Security-Framework-MobSF

## Instalação via Docker (recomendado)

```bash
docker pull opensecurity/mobile-security-framework-mobsf:latest

docker run -it --rm \
  -p 8000:8000 \
  opensecurity/mobile-security-framework-mobsf:latest

# Acessar em: http://localhost:8000
# Credenciais padrão: mobsf / mobsf
```

## Análise Estática (sem dispositivo)

Faça upload do APK na interface web. O MobSF gera automaticamente:

### Informações do Manifesto
- Componentes exportados (Activities, Services, Receivers, Providers)
- Permissões e classificação de risco
- Configurações inseguras (`debuggable`, `allowBackup`, `cleartext traffic`)

### Análise de Código
- Strings hardcoded (URLs, chaves, senhas)
- Chamadas de API sensíveis (`getDeviceId`, `getImei`, localização)
- Vulnerabilidades conhecidas por padrão de código
- Uso de criptografia fraca

### Análise de Binários Nativos
- Proteções habilitadas: `PIE`, `Stack Canary`, `RELRO`, `NX bit`
- Símbolos exportados (funções visíveis)

### Relatório de Malware
- Comparação com regras YARA
- Detecção de comportamentos suspeitos

## Análise Dinâmica (com emulador/dispositivo)

Requer dispositivo físico rootado ou emulador AVD com Frida instalado.

### Configuração
```bash
# Iniciar MobSF com suporte dinâmico
docker run -it --rm \
  -p 8000:8000 \
  -p 1337:1337 \
  -e MOBSF_ANALYZER_IDENTIFIER="emulator-5554" \
  opensecurity/mobile-security-framework-mobsf:latest
```

### O que a análise dinâmica captura
- Tráfego de rede (HTTP/HTTPS interceptado via proxy)
- Chamadas de API do sistema em runtime
- Arquivos criados/modificados durante execução
- Logs do `Logcat`
- Screenshots de telas visitadas
- Chamadas entre apps (Intents)

## API REST

```bash
# Upload e análise via API
curl -F "file=@app.apk" http://localhost:8000/api/v1/upload \
  -H "Authorization: YOUR_API_KEY"

# Iniciar análise estática
curl "http://localhost:8000/api/v1/scan?hash=<HASH_DO_APK>" \
  -H "Authorization: YOUR_API_KEY"

# Baixar relatório PDF
curl "http://localhost:8000/api/v1/download_pdf?hash=<HASH>" \
  -H "Authorization: YOUR_API_KEY" -o relatorio.pdf
```

## Score de Segurança

O MobSF gera um score de 0 a 100 baseado em:

```
Alto risco:    dados sensíveis em texto claro, criptografia fraca, activities exportadas
Médio risco:   allowBackup=true, debuggable=true, permissões desnecessárias
Baixo risco:   logs de debug, versão antiga de SDK target
```

## Integração CI/CD

```yaml
# Exemplo GitHub Actions
- name: MobSF Analysis
  run: |
    docker run -d -p 8000:8000 opensecurity/mobile-security-framework-mobsf
    sleep 30
    
    HASH=$(curl -s -F "file=@app.apk" http://localhost:8000/api/v1/upload \
      -H "Authorization: $MOBSF_API_KEY" | jq -r '.hash')
    
    curl -s "http://localhost:8000/api/v1/scan?hash=$HASH" \
      -H "Authorization: $MOBSF_API_KEY"
    
    # Verificar score mínimo
    SCORE=$(curl -s "http://localhost:8000/api/v1/scorecard?hash=$HASH" \
      -H "Authorization: $MOBSF_API_KEY" | jq '.security_score')
    
    if [ "$SCORE" -lt 70 ]; then
      echo "Score de segurança abaixo do mínimo: $SCORE"
      exit 1
    fi
```
