# Ataques e Testes iOS

| Técnica | Arquivo | Dificuldade |
|---|---|---|
| Bypass Jailbreak Detection | [bypass-jailbreak-detection.md](./bypass-jailbreak-detection.md) | Média |
| Bypass SSL Pinning | [bypass-ssl-pinning.md](./bypass-ssl-pinning.md) | Média |

## Pré-requisitos

```
- Dispositivo com TrollStore instalado (mínimo) ou jailbreak
- Frida + Objection configurados (ver ferramentas/)
- Burp Suite para análise de tráfego
- Hopper/Ghidra para análise estática do binário Mach-O
- class-dump para extrair interface das classes ObjC
```

## Diferença de Dificuldade vs Android

iOS é geralmente **mais difícil** de analisar porque:

```
✗ Binários Mach-O são criptografados pelo FairPlay (App Store)
  → Precisa de dispositivo jailbroken para descriptografar em memória

✗ Swift usa name mangling — símbolos não são legíveis diretamente
  → Precisa de Hopper ou desmembramento manual

✗ Sem equivalente ao JADX para iOS (não há decompilador com qualidade igual)
  → Análise estática fica mais em assembly/pseudocódigo

✓ Objective-C runtime é extremamente dinâmico → Frida funciona muito bem
✓ Keychain é mais padronizado → dump mais previsível
✓ NSURLSession é amplamente usado → menos variação de bibliotecas de rede
```
