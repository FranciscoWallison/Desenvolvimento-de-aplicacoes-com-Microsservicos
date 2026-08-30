/**
 * log.js — guarda de stdout + log em arquivo.
 *
 * ⚠️ Este módulo TEM de ser o primeiro import de `index.js`.
 * Em ESM os imports são avaliados na ordem em que aparecem, e o corpo do módulo
 * roda no momento do import — então o rebind de `console` abaixo acontece ANTES
 * de qualquer outro módulo do projeto ter chance de escrever em `process.stdout`.
 *
 * Motivo: no transporte stdio do MCP, `process.stdout` carrega EXCLUSIVAMENTE
 * mensagens JSON-RPC. Um único `console.log` corrompe o stream e o cliente
 * desconecta sem explicação.
 */

import fs from "node:fs";
import path from "node:path";

const MAX_LOG_BYTES = 5 * 1024 * 1024; // rotaciona em 5 MB

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3, trace: 4 };
const levelName = (process.env.MCP_NAV_LOG_LEVEL || "info").toLowerCase();
const threshold = LEVELS[levelName] ?? LEVELS.info;

const logFile = process.env.MCP_NAV_LOG_FILE || "";
let fileReady = false;

function ensureLogFile() {
  if (fileReady || !logFile) return fileReady;
  try {
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    fileReady = true;
  } catch {
    fileReady = false; // sem arquivo: stderr continua funcionando
  }
  return fileReady;
}

function rotateIfNeeded() {
  try {
    const st = fs.statSync(logFile);
    if (st.size > MAX_LOG_BYTES) fs.renameSync(logFile, `${logFile}.1`);
  } catch {
    /* arquivo ainda não existe */
  }
}

/**
 * Mascara segredos óbvios antes de qualquer escrita.
 * Nunca queremos senha/token/cookie no log, nem por acidente.
 */
export function redact(value) {
  let s = typeof value === "string" ? value : safeStringify(value);
  s = s.replace(/("(?:password|senha|token|secret|cookie|authorization|otp|code)"\s*:\s*)"[^"]*"/gi, '$1"[REDACTED]"');
  s = s.replace(/(Bearer\s+)[A-Za-z0-9._~+/-]+=*/g, "$1[REDACTED]");
  return s;
}

function safeStringify(value) {
  if (value instanceof Error) return `${value.name}: ${value.message}\n${value.stack || ""}`;
  if (typeof value === "object" && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function emit(level, args) {
  if ((LEVELS[level] ?? 99) > threshold) return;
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${redact(args.map(safeStringify).join(" "))}\n`;

  // stderr é sempre seguro — o cliente MCP não o interpreta como protocolo.
  try {
    process.stderr.write(line);
  } catch {
    /* stderr pode estar fechado num shutdown abrupto */
  }

  if (ensureLogFile()) {
    try {
      rotateIfNeeded();
      fs.appendFileSync(logFile, line);
    } catch {
      /* nunca deixar falha de log derrubar o servidor */
    }
  }
}

export const log = {
  error: (...a) => emit("error", a),
  warn: (...a) => emit("warn", a),
  info: (...a) => emit("info", a),
  debug: (...a) => emit("debug", a),
  trace: (...a) => emit("trace", a),
};

// ── O rebind. Roda no import, antes de todo o resto. ───────────────────────────
console.log = (...a) => emit("info", a);
console.info = (...a) => emit("info", a);
console.warn = (...a) => emit("warn", a);
console.debug = (...a) => emit("debug", a);
console.trace = (...a) => emit("trace", a);
console.error = (...a) => emit("error", a);

// Uma dependência pode chamar process.stdout.write direto. Interceptamos e
// desviamos tudo que não seja JSON-RPC do transporte (que escreve `{"jsonrpc"...`).
const realStdoutWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = function guardedWrite(chunk, ...rest) {
  const text = typeof chunk === "string" ? chunk : chunk?.toString?.("utf8") ?? "";
  if (text.startsWith("{") || text.startsWith("[")) return realStdoutWrite(chunk, ...rest);
  emit("warn", [`[stdout-guard] escrita não-JSON desviada para stderr: ${text.slice(0, 200)}`]);
  const cb = rest.find((r) => typeof r === "function");
  if (cb) cb();
  return true;
};
