/**
 * config.js — env → configuração. Só leitura de variáveis e normalização de
 * caminhos; nenhum acesso a disco ou rede (o boot tem de ser instantâneo).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(HERE, "..");

const bool = (v, dflt) => (v === undefined || v === "" ? dflt : v !== "0" && v.toLowerCase() !== "false");
const int = (v, dflt) => (Number.isFinite(Number(v)) && v !== "" && v !== undefined ? Number(v) : dflt);

function parseViewport(v) {
  const m = /^(\d+)\s*[xX]\s*(\d+)$/.exec(v || "");
  return m ? { width: Number(m[1]), height: Number(m[2]) } : { width: 1440, height: 900 };
}

/** Normaliza para barras normais — evita ter que escapar `\\` e some com a
 *  conversão de path do MSYS quando o servidor é testado pelo Git Bash. */
export const norm = (p) => (p ? p.replace(/\\/g, "/") : p);

export const config = {
  // ── Navegador ───────────────────────────────────────────────────────────────
  channel: process.env.MCP_NAV_BROWSER_CHANNEL || "chrome",
  executablePath: norm(process.env.MCP_NAV_EXECUTABLE_PATH || "") || undefined,
  userDataDir: norm(process.env.MCP_NAV_USER_DATA_DIR || path.join(process.env.USERPROFILE || process.env.HOME || ".", ".mcp-navegador", "chrome-profile")),
  cdpEndpoint: process.env.MCP_NAV_CDP_ENDPOINT || "",
  // Headless nunca é exposto como parâmetro de tool: o login da Microsoft e o
  // MFA precisam de janela visível, e headless dispara risk detection no Entra.
  headless: bool(process.env.MCP_NAV_HEADLESS, false),
  viewport: parseViewport(process.env.MCP_NAV_VIEWPORT),
  navigationTimeoutMs: int(process.env.MCP_NAV_NAV_TIMEOUT_MS, 60000),
  actionTimeoutMs: int(process.env.MCP_NAV_ACTION_TIMEOUT_MS, 15000),

  // ── Saída de documentação ───────────────────────────────────────────────────
  docsRoot: norm(process.env.MCP_NAV_DOCS_ROOT || process.cwd()),
  defaultDocsDir: norm(process.env.MCP_NAV_DEFAULT_DOCS_DIR || "."),
  imgSubdir: process.env.MCP_NAV_IMG_SUBDIR || "imgs",

  // ── Segurança ───────────────────────────────────────────────────────────────
  allowEval: bool(process.env.MCP_NAV_ALLOW_EVAL, false),
  confirmChannel: process.env.MCP_NAV_CONFIRM_CHANNEL || "browser",
  confirmTtlSec: int(process.env.MCP_NAV_CONFIRM_TTL_SEC, 120),

  // ── Limites ─────────────────────────────────────────────────────────────────
  // Nenhuma tool bloqueia além disto: o cliente MCP tem timeout de tool call, e
  // o usuário pode levar 10 min no MFA. Retornamos {status:"waiting"} e ele chama de novo.
  maxWaitSecHardCap: int(process.env.MCP_NAV_MAX_WAIT_SEC, 60),

  policyDir: path.join(PROJECT_ROOT, "policy"),
  stateDir: path.join(PROJECT_ROOT, "state"),
};

export const clampWait = (s) => Math.max(1, Math.min(Number(s) || 30, config.maxWaitSecHardCap));
