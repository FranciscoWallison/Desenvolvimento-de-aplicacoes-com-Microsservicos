# TrollStore

Instalador permanente de IPAs para iOS que explora uma vulnerabilidade no processo de validação de assinaturas (`CoreTrust bug`) para instalar apps sem jailbreak completo e sem conta de desenvolvedor Apple.

Repositório: https://github.com/opa334/TrollStore

## O que é CoreTrust

CoreTrust é o componente do iOS responsável por verificar assinaturas de código em apps instalados. O bug explorado pelo TrollStore permite assinar apps com um certificado de sistema (root CA da Apple) que o CoreTrust aceita como legítimo, mesmo sem passar pelo processo de assinatura da App Store.

```
Processo normal:
  IPA → App Store → Apple assina → iOS verifica assinatura Apple → instala

Processo TrollStore:
  IPA → assinado com cert. específico (CoreTrust bug) → iOS aceita como sistema → instala permanentemente
```

## Compatibilidade

| Versão iOS | Método de Instalação |
|---|---|
| iOS 14.0 – 16.6.1 | TrollInstaller / trollinstaller via Safari bug |
| iOS 16.7 – 17.0 | Método específico por versão (verificar repo) |
| iOS 17.0+ | Suporte variável — checar https://github.com/opa334/TrollStore |

> TrollStore funciona em **dispositivos não jailbroken**. O exploit é na validação de assinatura, não no kernel.

## O que TrollStore permite

```
✓ Instalar IPAs permanentemente (não expira como contas de dev gratuitas)
✓ Instalar apps com entitlements elevados (que a App Store não permite)
✓ Apps sem sandbox (com entitlement especial)
✓ Rodar Frida como serviço em background
✓ Instalar SSH server (OpenSSH via IPA)
✓ Acessar arquivos do sistema com entitlements corretos
✗ Não é jailbreak — kernel permanece restrito
✗ Não dá root no sentido tradicional
✗ Sem acesso ao filesystem do sistema (apenas entitlements específicos)
```

## Instalação

```
1. Verificar compatibilidade do dispositivo/versão iOS em:
   https://github.com/opa334/TrollStore

2. Instalar via método recomendado para sua versão:
   - iOS 16.6.1 e abaixo: TrollInstaller via navegador
   - Versões específicas: usando app de sistema (Tips, Mail) como veículo

3. Após instalado, TrollStore aparece como app normal na home screen
```

## Instalar IPAs via TrollStore

```bash
# Método 1: Via sideloading direto no dispositivo
# Abrir o .ipa no Files app → compartilhar com TrollStore → instalar

# Método 2: Via ADB/SSH
adb push meu_app.ipa /var/mobile/Documents/
# No dispositivo: abrir via Files → TrollStore

# Método 3: Via TrollStore URL scheme
# trollstore://install?url=http://servidor/app.ipa
```

## Criar IPA com Entitlements Elevados

Para aproveitar as capacidades do TrollStore:

```bash
# 1. Criar entitlements.plist com permissões extras
cat > entitlements.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" ...>
<plist version="1.0">
<dict>
    <!-- Acesso a arquivos além do container -->
    <key>com.apple.private.security.storage.AppDataContainers</key>
    <true/>
    
    <!-- Rodar como plataform-application -->
    <key>platform-application</key>
    <true/>
    
    <!-- Desabilitar sandbox (use com cautela) -->
    <key>com.apple.private.security.no-sandbox</key>
    <true/>
    
    <!-- Permite debugger conectar -->
    <key>get-task-allow</key>
    <true/>
</dict>
</plist>

# 2. Assinar o binário com ldid
ldid -Sentitlements.plist App.app/App

# 3. Criar IPA
zip -r MeuApp.ipa Payload/

# 4. Instalar via TrollStore
```

## Usar TrollStore para Análise de Segurança

### Instalar Frida como serviço

```bash
# Baixar frida-server para iOS (ARM64)
# https://github.com/frida/frida/releases
# Ex: frida-server-16.x.x-ios-arm64.xz

# Criar IPA wrapper para frida-server com entitlements
# (existem repos prontos com frida-server empacotado para TrollStore)
# Ex: https://github.com/khanhduytran0/FridaLoader

# Após instalar via TrollStore, frida-server roda permanentemente
```

### Instalar OpenSSH

```bash
# Usar Cydia Impactor ou repositórios específicos de IPAs para TrollStore
# Com SSH ativo, conectar ao dispositivo:
ssh root@<IP_DO_DISPOSITIVO>
# senha padrão: alpine
```

## TrollStore vs Jailbreak

| Aspecto | TrollStore | Jailbreak (palera1n) |
|---|---|---|
| Kernel modificado | Não | Sim |
| Root shell | Não (sem SSH padrão) | Sim |
| Entitlements elevados | Sim (selecionados) | Sim (total) |
| Acesso ao filesystem | Limitado (entitlements) | Total |
| Persistência | Permanente | Depende do JB |
| Risco de brick | Muito baixo | Baixo-médio |
| Versões suportadas | Específicas | Específicas (bootrom) |
| Ideal para | Análise sem JB, instalar tools | Análise completa |
