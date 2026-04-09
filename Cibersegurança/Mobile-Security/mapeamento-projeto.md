Aqui está o mapeamento do seu projeto **`cyber-mob`** organizado para referência rápida. Estruturei as informações de forma visual para facilitar a memorização do estado atual e dos recursos disponíveis.

---

# 🗺️ Mapeamento de Status: Projeto Cyber-Mob

### 1. 📂 Estrutura de Diretórios (O "Mapa do Tesouro")

* **`apps/`**: O coração do projeto. Contém os 5 alvos (Android Nativo, Flutter, Ionic, RN CLI, RN Expo).
* **`rasp-lib/`**: A "Joia da Coroa". Biblioteca nativa **C++17** compartilhada (funcionalidades Anti-Root, Anti-Frida, Detecção de Emulador, Ofuscação XOR).
* **`scripts/`** & **`frida/`**: Automação e Ataque. Scripts para build, análise estática (MobSF/JADX) e testes dinâmicos (Frida).
* **`vendor/`**: O Arsenal. Onde residem as ferramentas externas (JDK 21, JADX, Ghidra, RootAVD).
* **`analysis/`** & **`docs/`**: A Inteligência. Relatórios de saída, APKs de teste e documentação de fases.

---

### 2. 📱 Estado Atual dos Aplicativos (Matriz Comparativa)

Todos os apps integram a mesma biblioteca RASP, mas possuem configurações de build distintas.

| Framework | Package Name | Motor / SDK | Segurança Atual (Build) |
| --- | --- | --- | --- |
| **Android Nativo** | `com.cybermob.app` | SDK 34 (Java/Kotlin) | ✅ ProGuard (Minify + Shrink) |
| **Flutter** | `...flutter_app` | Flutter Engine | 🔒 Ofuscação Padrão Flutter |
| **React Native CLI** | `com.cybermobrn` | SDK 36 / Hermes | ⚡ New Architecture Habilitada |
| **RN Expo** | `com.chicowall...` | Expo Managed / Hermes | ⚡ New Architecture Habilitada |
| **Ionic Capacitor** | `io.ionic.starter` | Capacitor / Gradle | ⚙️ Configuração Padrão |

> **⚠️ Ponto de Atenção:** Atualmente, **todos** os apps estão assinados com **Debug Keystore**. Para o ranking do portfólio, será necessário gerar as versões de **Release (Produção)**.

---

### 3. 🛠️ Arsenal de Ferramentas Disponível (`/vendor`)

Você já possui um ambiente de engenharia reversa completo configurado localmente:

* **Compilação & Execução:**
* ☕ `JDK 21` (Versão 21.0.6)
* 📦 `bundletool` (Para manipular arquivos .aab)
* 📱 `rootAVD` (Para testes de detecção de root em emuladores)


* **Análise & Decompilação:**
* 🔍 `JADX` (v1.5.3 - Ouro para converter DEX em Java legível)
* 🐉 `Ghidra` (Para análise profunda da `rasp-lib` em Assembly)
* 👁️ `Bytecode-Viewer` (Inspeção visual rápida)



---

### 4. 🤖 Automação Pronta (`/scripts`)

Você já venceu a parte mais difícil: a automação.

* **`build_all.py`**: Compila todos os 5 frameworks com um comando.
* **`run_static_analysis.py`**: Pipeline de CI/CD local que já integra JADX + ApkTool + MobSF (via Docker).

---

### 🎯 Próximo Objetivo (Action Item)

Para finalizar o "Projeto Técnico Mobile Security", a única peça que falta é a transição de **Debug** para **Release**.

**Sua missão agora é:**

1. Gerar uma **Keystore de Produção** única.
2. Ajustar o `build_all.py` para usar essa keystore e assinar os APKs.
3. Rodar o `run_static_analysis.py` nos binários finais para gerar o relatório comparativo.