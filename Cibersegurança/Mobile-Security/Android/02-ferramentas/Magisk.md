# Magisk

Solução de root para Android que opera no **userspace**, modificando o sistema de forma "systemless" — sem alterar a partição `/system`.

## Como Funciona

```
Boot normal:
  Bootloader → Kernel → init → Zygote → SystemServer

Boot com Magisk:
  Bootloader → Kernel → init → [Magisk patches init.rc] → MagiskInit → Zygote
```

O Magisk intercepta o processo de boot via `init.rc` e monta um overlay virtual sobre `/system`, `/vendor` e `/product` sem modificar as partições reais.

## Componentes

| Componente | Função |
|---|---|
| **MagiskInit** | Inicialização antes do Android framework |
| **MagiskD** | Daemon que gerencia módulos e o daemon `su` |
| **MagiskSU** | Provedor de acesso root para apps |
| **Zygisk** | Injeção no processo Zygote (substitui Riru) |
| **Magisk App** | Interface gráfica para gerenciar módulos |

## Módulos Úteis para Segurança

```
Shamiko          → Esconde root de apps via DenyList
LSPosed          → Framework de hooks baseado em Zygisk
MagiskHide       → Versão legada de ocultação (descontinuado no v24+)
PlayIntegrityFix → Bypass do Play Integrity API (substituto do SafetyNet)
MagiskTrustUser  → Adiciona certificados de CA ao trust store do sistema
```

## SafetyNet / Play Integrity

Apps bancários e de DRM usam a Google Play Integrity API para verificar se o dispositivo é confiável.

### Níveis de verificação
```
MEETS_BASIC_INTEGRITY      → Dispositivo não foi adulterado
MEETS_DEVICE_INTEGRITY     → Dispositivo certificado pelo Google
MEETS_STRONG_INTEGRITY     → Boot verificado sem modificações (mais difícil de bypassar)
```

### Bypass atual (2024+)
```
1. Instalar PlayIntegrityFix (módulo Magisk)
2. Configurar DenyList para o app alvo
3. Ativar Zygisk
4. (Se necessário) Usar Shamiko para esconder root
```

## Zygisk

Substituto do Riru — injeta código no processo Zygote antes de qualquer app ser iniciado.

```
Zygote (processo pai de todos os apps)
    └── Zygisk hook aqui
            └── Todos os apps herdam o hook
```

### Uso típico com LSPosed
```
Magisk → Zygisk ativado → LSPosed instalado → módulos de hook carregados
```

## DenyList

Lista de apps que não devem ver o Magisk/root. Configurada no app do Magisk.

```
# Apps típicos na DenyList
com.google.android.gms       (Google Play Services)
com.android.vending           (Play Store)
com.nu.production             (Nubank)
com.itau                      (Itaú)
br.com.bb.android             (Banco do Brasil)
```

## Instalação

```bash
# Pré-requisitos
adb reboot bootloader
fastboot oem unlock          # desbloqueia bootloader (apaga dados)

# Instalar Magisk
# 1. Baixar Magisk.apk em https://github.com/topjohnwu/Magisk
# 2. Fazer patch da boot.img do dispositivo via app Magisk
# 3. Flashar boot.img patchada:
fastboot flash boot magisk_patched.img
fastboot reboot
```
