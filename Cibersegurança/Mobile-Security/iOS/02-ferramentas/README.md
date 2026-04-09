# Ferramentas iOS

| Ferramenta | Tipo | Requisito |
|---|---|---|
| [TrollStore](./TrollStore.md) | Instalação permanente de IPA | iOS 14-17 (device-specific) |
| [Frida](./Frida.md) | Instrumentação dinâmica | Jailbreak ou TrollStore |
| [Objection](./Objection.md) | Shell sobre Frida | Frida instalado |

## Outras Ferramentas Relevantes

| Ferramenta | Descrição |
|---|---|
| **Hopper Disassembler** | Disassembler/decompiler para Mach-O (melhor que Ghidra para iOS) |
| **class-dump** | Extrai headers de classes Objective-C de binários |
| **Cycript** | REPL JavaScript/ObjC para manipular apps em runtime (requer jailbreak) |
| **LLDB** | Debugger oficial — funciona via Xcode ou SSH |
| **Bagbak** | Decripta IPAs protegidos pelo FairPlay (DRM) — requer jailbreak |
| **palera1n** | Jailbreak baseado em checkm8 para A8-A11 (bootrom exploit) |
| **checkra1n** | Jailbreak baseado em checkm8 (legado, até iPhone X) |

## Fluxo Típico de Análise iOS

```
1. Obter o IPA
   ├── Da App Store (criptografado com FairPlay)
   └── Via Bagbak/CrackerXI em dispositivo jailbroken (descriptografado)

2. Análise estática
   ├── class-dump → extrair headers Objective-C
   ├── Hopper → desassemblar binário Mach-O
   └── strings + grep → buscar segredos hardcoded

3. Análise dinâmica
   ├── Frida + Objection → hooking em runtime
   ├── LLDB → debugging
   └── Burp Suite → interceptar tráfego (após bypass SSL pinning)

4. Relatório
```
