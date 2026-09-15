# 🌐 mcp-navegador

Servidor **MCP** que dirige um **Chrome real** com **perfil persistente** — para navegar cursos e portais (Azure Academy, Azure Portal, Azure DevOps), ler o conteúdo das aulas e **capturar evidência direto na documentação** deste repositório.

> **Divisão do trabalho:** o assistente navega, clica, lê e documenta. **Login, MFA e pagamento são exclusivos do usuário** — o servidor bloqueia essas telas por design.

---

## 🚀 Instalação

```bash
# Node vem do scoop e NÃO está nos shims — use o caminho da app
export PATH="$PATH:/c/Users/walli/scoop/apps/nodejs-lts/current"

cd tools/mcp-navegador
npm ci          # única operação de rede do projeto
```

Não baixa navegador: usamos `playwright-core` (que nunca faz download) apontando para o **Chrome já instalado** via `channel: "chrome"`.

### Verificar antes de ligar no Claude Code

```bash
npm run handshake      # protocolo: initialize + tools/list + pureza do stdout
node scripts/smoke.js  # ponta a ponta: abre o Chrome, snapshot, screenshot, extract
```

O `handshake` tem de mostrar **20 tools** e `initialize` em algumas centenas de ms.

---

## 🔌 Registro no Claude Code

Em `C:/Users/walli/.claude.json`, dentro de `mcpServers`:

```json
"navegador": {
  "type": "stdio",
  "command": "C:/Users/walli/scoop/apps/nodejs-lts/current/node.exe",
  "args": ["f:/projetos/Desenvolvimento-de-aplicacoes-com-Microsservicos/tools/mcp-navegador/src/index.js"],
  "env": {
    "MCP_NAV_USER_DATA_DIR": "C:/Users/walli/.mcp-navegador/chrome-profile",
    "MCP_NAV_DOCS_ROOT": "f:/projetos/Desenvolvimento-de-aplicacoes-com-Microsservicos",
    "MCP_NAV_DEFAULT_DOCS_DIR": "Devops/Cloud/Azure-Academy",
    "PLAYWRIGHT_BROWSERS_PATH": "C:/Users/walli/AppData/Local/ms-playwright",
    "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD": "1"
  }
}
```

Depois **reinicie o Claude Code** e confirme com `/mcp` → `navegador: connected`.

> 🚨 **REGRA INEGOCIÁVEL: `command` é sempre o caminho absoluto do `node.exe`.**
> Nunca `npx`, `npm` ou `node` soltos. Nesta máquina o `npx` é um **`.cmd`**, e o
> `CreateProcess` do Windows só completa `.exe` — o processo **nunca nasce** e o
> cliente morre com `CONNECT_TIMEOUT` depois de 30 s. Foi exatamente isso que
> derrubava os servidores `playwright` e `discord`.

---

## ⚙️ Variáveis de ambiente

| Variável | Padrão | Para que serve |
|---|---|---|
| `MCP_NAV_BROWSER_CHANNEL` | `chrome` | Canal do navegador (`chrome`, `msedge`, `chrome-beta`) |
| `MCP_NAV_EXECUTABLE_PATH` | — | Sobrepõe o canal com um binário específico. Fallback útil: `.../ms-playwright/chromium-1223/chrome-win64/chrome.exe` |
| `MCP_NAV_USER_DATA_DIR` | `~/.mcp-navegador/chrome-profile` | Perfil persistente — é o que faz o login sobreviver a reinícios |
| `MCP_NAV_CDP_ENDPOINT` | — | Se definido, **anexa** a um Chrome já rodando em vez de abrir um. Ver *Modo CDP* |
| `MCP_NAV_HEADLESS` | `0` | Mantenha `0`. Headless dispara *risk detection* no Entra ID e inviabiliza MFA |
| `MCP_NAV_VIEWPORT` | `1440x900` | Tamanho da janela |
| `MCP_NAV_DOCS_ROOT` | `cwd` | Raiz da documentação. **Nada é gravado fora dela** |
| `MCP_NAV_DEFAULT_DOCS_DIR` | `.` | Pasta padrão das lições, relativa à raiz |
| `MCP_NAV_IMG_SUBDIR` | `imgs` | Subpasta das capturas |
| `MCP_NAV_ALLOW_EVAL` | `0` | Habilita `browser_evaluate` (que ainda assim exige confirmação) |
| `MCP_NAV_CONFIRM_CHANNEL` | `browser` | `browser` (banner na página) ou `file` |
| `MCP_NAV_CONFIRM_TTL_SEC` | `120` | Validade do token de confirmação |
| `MCP_NAV_MAX_WAIT_SEC` | `60` | Teto de bloqueio de qualquer tool de espera |
| `MCP_NAV_LOG_LEVEL` | `info` | `error`/`warn`/`info`/`debug`/`trace` |
| `MCP_NAV_LOG_FILE` | — | Caminho do log em arquivo (rotaciona em 5 MB) |

---

## 🧰 As 20 tools

### Navegação
| Tool | O que faz |
|---|---|
| `browser_status` | Estado, abas e heurística de sessão por site. Abre o Chrome se preciso |
| `browser_navigate` | Vai para uma URL e devolve snapshot |
| `browser_navigate_history` | Voltar / avançar |
| `browser_tabs` | Listar, selecionar, abrir, fechar abas |

### Inspeção
| Tool | O que faz |
|---|---|
| `browser_snapshot` | Árvore de acessibilidade em YAML com refs `[ref=e12]`. **Atravessa iframes** (`f1e12`) |
| `browser_extract` | Página → Markdown limpo (Readability). Com `saveTo`, grava o `.md` na documentação |
| `browser_evaluate` | JS para **ler** o DOM. Desligado por padrão |

### Interação
`browser_click` · `browser_hover` · `browser_type` · `browser_press_key` · `browser_select_option` · `browser_scroll` · `browser_wait_for`

Todas usam `ref` (do snapshot mais recente) + `element` (descrição humana, que aparece no diálogo de confirmação).

### Evidência
| Tool | O que faz |
|---|---|
| `browser_screenshot` | Captura e grava em `imgs/{licao}_{NN}_{slug}.png`, devolvendo o snippet Markdown pronto |
| `browser_download` | Baixa um arquivo **com a sessão viva do navegador** (material de curso atrás de login) e grava dentro da raiz de documentação |

### Controle humano
| Tool | O que faz |
|---|---|
| `wait_for_login` | Aguarda o usuário concluir login/MFA |
| `pause_for_human` | Pede uma ação ao usuário num banner na página |
| `confirm_action` | Aprovação de ação sensível |
| `browser_close` | Fecha a janela (o login continua salvo no perfil) |

---

## 🔒 Trilhos de segurança

Aplicados **no servidor**, antes da ação. O julgamento do assistente não entra na decisão.

**Camada 1 — zonas humanas (bloqueio duro, nenhum token libera).**
`login.microsoftonline.com`, `login.live.com`, `*.b2clogin.com`, `account.microsoft.com/billing`, a tela de login do LMS e afins. Além disso, **campos de senha e OTP são recusados em qualquer URL**. Não existe caminho no código que digite credencial, e **não há tool que exporte cookies ou `storage_state`** — de propósito.

**Camada 2 — texto do alvo.** Nome acessível, texto do elemento **e a descrição passada em `element`** são testados contra `policy/denylist.json` (`cobrança`, `billing`, `comprar`, `excluir`, `assinatura`…). A descrição entra sempre no exame: se a leitura do DOM falhar (nó destacado, SPA re-renderizando), o clique em "Comprar" ainda assim é barrado.

**Camada 3 — regras por domínio.** `policy/domain-rules.json`: a tela de billing do Azure DevOps, `Create`/`Delete` no Azure Portal, e todo `browser_evaluate`.

### Fluxo de confirmação

```
browser_click({ref, element:"botão Set up billing"})
   ↓  servidor NÃO clica
   →  { blocked:true, token:"cfm_…", ttlSec:120 }
confirm_action({token})
   ↓  banner aparece NA PÁGINA → usuário clica Aprovar
   →  { status:"approved" }
browser_click({ref, element:"…", confirmToken:"cfm_…"})
   ↓  agora sim executa
```

O token é de **uso único**, expira, e é **invalidado se a página mudar** entre a aprovação e a execução — o Azure Portal é uma SPA que re-renderiza o tempo todo, e sem isso aprovar "Cancelar" poderia virar um clique em "Comprar".

O banner é injetado via `page.evaluate(fn)`, que roda por CDP e **não passa por `eval` nem por `<script>`** — logo é imune ao CSP estrito do Azure Portal.

---

## 🖼️ Convenção das capturas

```
Devops/Cloud/Azure-Academy/
├─ 02-ativar-agent-pool.md
└─ imgs/
   └─ 02-ativar-agent-pool_01_organization-settings.png
```

- O número vem de um `readdir` da pasta, **não** de contador em memória → a sequência continua certa depois de reiniciar o servidor, sem buracos nem sobrescrita.
- O slug é ASCII (acento removido via `NFD`).
- O caminho devolvido é **relativo ao diretório do `.md`** — funciona igual no VS Code e no GitHub, e é imune ao problema de *case* que quebrou as imagens antigas de `Devops/Jenkins`.
- Campos de senha e o menu de conta são **borrados automaticamente** (`maskAccount`), porque estas capturas vão para um repositório público. **Ainda assim, revise antes de commitar.**

---

## 🐞 Troubleshooting

| Sintoma | Causa | Solução |
|---|---|---|
| `CONNECT_TIMEOUT` no `/mcp` | `command` usando `npx`/`node` sem caminho | Caminho absoluto do `node.exe` |
| Chrome não abre, erro de lock | Já há Chrome usando este perfil | Feche a janela, ou use `browser_close`. **Nunca** aponte para o perfil pessoal do Chrome |
| "profile from a newer version" | Perfil escrito por um Chrome mais novo (Canary) | Use um `MCP_NAV_USER_DATA_DIR` novo |
| Baixou ~150 MB na 1ª chamada | Playwright resolvendo o chromium dele | Confirme `channel:"chrome"` e `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` |
| `STALE_REF` | A SPA re-renderizou | Novo `browser_snapshot` e refs atualizados |
| MFA por passkey / Windows Hello falha | Autenticador de plataforma num Chrome dirigido | Modo CDP (abaixo) |
| Página em branco no `browser_extract` | Conteúdo ainda carregando | `browser_wait_for({networkIdle:true})` antes |
| `browser_download` devolve `SESSAO_EXPIRADA` | O site respondeu HTML em vez do arquivo | **Cookie de sessão morre no `browser_close`.** Sites ASP/PHP sem "lembrar-me" perdem o login quando a janela fecha — diferente do Azure DevOps, que tem cookie persistente. Refaça o login e baixe **sem fechar** o navegador |

### Modo CDP (anexar em vez de abrir)

Só é necessário se o MFA por passkey falhar. **O `--user-data-dir` tem de ser diferente do padrão** — desde o Chrome 136 a flag de depuração é ignorada no perfil padrão:

```bash
chrome.exe --remote-debugging-port=9222 --user-data-dir=C:/Users/walli/.mcp-navegador/cdp-profile
```

Depois defina `MCP_NAV_CDP_ENDPOINT=http://127.0.0.1:9222`. Nenhuma tool muda.

---

## 📁 Estrutura

```
src/
  index.js      entrypoint stdio — ZERO I/O no boot (é o que evita o CONNECT_TIMEOUT)
  log.js        guarda de stdout: console.* → stderr. Importado PRIMEIRO, sempre
  config.js     env → configuração
  browser.js    singleton preguiçoso do Chrome; o navegador só sobe na 1ª tool
  refs.js       ariaSnapshot({mode:"ai"}) + selector aria-ref=
  risk.js       as 3 camadas de trilho
  confirm.js    tokens de uso único, atados a (tool, ref, url, hash da página)
  overlay.js    banner de aprovação injetado na página (imune a CSP)
  evidence.js   nomeação e gravação das capturas
  extract.js    HTML → Markdown (roda no Node, não na página)
  tools/        as 20 tools, agrupadas por tema
policy/         listas editáveis sem tocar em código
scripts/        handshake.js (protocolo) e smoke.js (ponta a ponta)
state/          logs e tokens — gitignored
```
