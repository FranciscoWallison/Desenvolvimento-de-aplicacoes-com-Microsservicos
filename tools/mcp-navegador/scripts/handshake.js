/**
 * handshake.js — smoke test do protocolo, sem precisar do Claude Code.
 *
 * Verifica as três coisas que quebraram o servidor `playwright` desta máquina:
 *   1. o processo nasce;
 *   2. o `initialize` responde rápido (bem abaixo dos 30 s de timeout do cliente);
 *   3. o stdout carrega SÓ JSON-RPC — nenhum log vazado.
 *
 * O teste é dirigido por evento, não por prazo fixo: encerra assim que as duas
 * respostas chegam. (Um deadline curto dava falso negativo quando o Windows
 * demorava a subir o processo — o servidor respondia depois, certinho.)
 *
 * Uso:  node scripts/handshake.js
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ENTRY = path.join(HERE, "..", "src", "index.js");
const TETO_MS = 20000; // muito acima do normal (~400 ms); só evita travar para sempre

const ESPERADAS = [
  "browser_status", "browser_navigate", "browser_navigate_history", "browser_tabs",
  "browser_snapshot", "browser_extract", "browser_evaluate",
  "browser_click", "browser_hover", "browser_type", "browser_press_key",
  "browser_select_option", "browser_scroll", "browser_wait_for",
  "browser_screenshot", "browser_download",
  "wait_for_login", "pause_for_human", "confirm_action", "browser_close",
];

const t0 = Date.now();
const child = spawn(process.execPath, [ENTRY], {
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env, MCP_NAV_LOG_LEVEL: "info" },
});

let stdout = "";
let stderr = "";
let initMs = null;
const recebidas = new Map(); // id → mensagem
let pendente = "";

child.stdout.on("data", (d) => {
  if (initMs === null) initMs = Date.now() - t0;
  const txt = d.toString();
  stdout += txt;
  pendente += txt;
  const linhas = pendente.split("\n");
  pendente = linhas.pop() ?? "";
  for (const l of linhas) {
    if (!l.trim()) continue;
    try {
      const m = JSON.parse(l);
      if (m.id !== undefined) recebidas.set(m.id, m);
    } catch {
      /* linha inválida é avaliada no relatório final */
    }
  }
  if (recebidas.has(1) && !enviouList) enviarList();
  if (recebidas.has(1) && recebidas.has(2)) finalizar();
});
child.stderr.on("data", (d) => (stderr += d.toString()));
child.on("error", (err) => {
  stderr += `\n[spawn error] ${err.message}\n`;
  finalizar();
});
child.on("exit", (code, sig) => {
  if (!terminou) {
    stderr += `\n[child exit] code=${code} sig=${sig}\n`;
    finalizar();
  }
});

const send = (obj) => child.stdin.write(`${JSON.stringify(obj)}\n`);

let enviouList = false;
function enviarList() {
  enviouList = true;
  send({ jsonrpc: "2.0", method: "notifications/initialized" });
  send({ jsonrpc: "2.0", id: 2, method: "tools/list" });
}

send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "handshake", version: "0" } } });

const teto = setTimeout(() => {
  stderr += `\n[timeout] nada completo em ${TETO_MS} ms\n`;
  finalizar();
}, TETO_MS);

let terminou = false;
function finalizar() {
  if (terminou) return;
  terminou = true;
  clearTimeout(teto);
  try {
    child.stdin.end();
    child.kill();
  } catch {
    /* já morreu */
  }

  let pass = true;
  const say = (okFlag, msg) => {
    if (!okFlag) pass = false;
    process.stderr.write(`${okFlag ? "PASS  " : "FALHOU"}  ${msg}\n`);
  };

  const linhas = stdout.split("\n").filter((l) => l.trim());
  say(linhas.length > 0, `stdout recebeu ${linhas.length} linha(s)`);

  let soJson = true;
  for (const l of linhas) {
    try {
      JSON.parse(l);
    } catch {
      soJson = false;
      process.stderr.write(`          linha não-JSON no stdout: ${l.slice(0, 160)}\n`);
    }
  }
  say(soJson, "stdout contém APENAS JSON-RPC (nenhum log vazado)");

  say(Boolean(recebidas.get(1)?.result), `initialize respondeu em ${initMs ?? "—"} ms`);
  say(initMs !== null && initMs < 5000, "initialize bem abaixo do timeout de 30 s do cliente");

  const tools = recebidas.get(2)?.result?.tools || [];
  say(tools.length >= ESPERADAS.length, `tools/list devolveu ${tools.length} tools (esperado >= ${ESPERADAS.length})`);

  const nomes = tools.map((t) => t.name);
  const faltando = ESPERADAS.filter((e) => !nomes.includes(e));
  say(faltando.length === 0, faltando.length ? `faltando: ${faltando.join(", ")}` : "todas as tools esperadas estão registradas");

  process.stderr.write(`\nstderr do servidor:\n${stderr.split("\n").slice(0, 12).join("\n")}\n`);
  process.stderr.write(`\n${pass ? "TUDO OK" : "HÁ FALHAS"}\n`);
  process.exit(pass ? 0 : 1);
}
