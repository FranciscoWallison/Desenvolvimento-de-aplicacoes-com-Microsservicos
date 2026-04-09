# RootAVD

Ferramenta para **rootar emuladores AVD** (Android Virtual Device) do Android Studio usando Magisk, sem precisar de dispositivo físico.

Repositório: https://github.com/newbit1/rootAVD

## Por que rootar o emulador?

Emuladores AVD por padrão não têm root. Para análise de segurança é necessário:
- Instalar Frida server
- Usar `su` para comandos privilegiados
- Modificar arquivos do sistema
- Testar comportamento de apps em dispositivos rootados

## Pré-requisitos

```bash
# Android Studio instalado com SDK
# Emulador criado com imagem "Google APIs" (não "Google Play")
# Imagens "Google Play" têm bootloader bloqueado — não funcionam com RootAVD

# Verificar imagens disponíveis:
$ANDROID_HOME/tools/bin/avdmanager list avd
```

## Instalação

```bash
# 1. Clonar o repositório
git clone https://github.com/newbit1/rootAVD.git
cd rootAVD

# 2. Iniciar o emulador PRIMEIRO (sem fechar)
$ANDROID_HOME/emulator/emulator -avd <nome_do_avd> &

# 3. Rodar o script
# Windows:
rootAVD.bat system-images/android-34/google_apis/x86_64/ramdisk.img

# Linux/Mac:
./rootAVD.sh system-images/android-34/google_apis/x86_64/ramdisk.img

# 4. Quando solicitado, instalar Magisk no emulador e reiniciar
```

## O que o RootAVD faz

```
1. Extrai ramdisk.img do AVD
2. Aplica patch do Magisk na ramdisk
3. Recompacta e substitui o ramdisk.img original
4. Na próxima inicialização do emulador, Magisk está ativo
```

## Instalar Frida Server após root

```bash
# Verificar arquitetura do emulador
adb shell getprop ro.product.cpu.abi
# Retorna: x86_64 (para emuladores padrão)

# Baixar frida-server da release correspondente
# https://github.com/frida/frida/releases
# Arquivo: frida-server-XX.X.X-android-x86_64.xz

# Instalar
adb push frida-server /data/local/tmp/
adb shell chmod 755 /data/local/tmp/frida-server
adb shell su -c /data/local/tmp/frida-server &

# Verificar
frida-ps -U
```

## Verificar root

```bash
adb shell
su                  # deve abrir shell com #
id                  # uid=0(root)
```

## Notas importantes

```
✓ Use imagem "Google APIs" — não "Google Play Store"
✓ O emulador deve estar RODANDO antes de executar o script
✓ Após rodar RootAVD, instale o Magisk Manager manualmente
✗ Não funciona com imagens ARM em host x86 (muito lento de qualquer forma)
```

## Cold Boot após root

O emulador rootado requer **cold boot** para preservar as modificações:

```bash
# No Android Studio: Extended Controls → Snapshots → desativar auto-save
# OU iniciar sempre com:
$ANDROID_HOME/emulator/emulator -avd <nome> -no-snapshot-load
```
