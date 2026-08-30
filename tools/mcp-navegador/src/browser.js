/**
 * browser.js — singleton preguiçoso do Chrome.
 *
 * Regra de ouro: NADA aqui roda no boot do servidor. `playwright-core` só é
 * importado (via `await import`) na primeira tool que realmente precise de uma
 * página. É isso que mantém o `initialize` do MCP em ~150 ms e evita o
 * CONNECT_TIMEOUT de 30 s que derrubava o servidor `playwright` desta máquina.
 */

import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import { log } from "./log.js";

let ctx = null; // BrowserContext
let browser = null; // só no modo CDP
let launching = null; // promise lock: chamadas concorrentes esperam a mesma
let mode = null; // "persistent" | "cdp"

/** Argumentos de lançamento.
 *  Não é sobre burlar detecção — é sobre o login da Microsoft não quebrar.
 *  Um user-agent falsificado é justamente o que mais dispara bloqueio, então
 *  deliberadamente NÃO mexemos no UA. */
const LAUNCH_ARGS = [
  "--disable-blink-features=AutomationControlled",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-features=Translate,OptimizationHints",
];

function assertProfileFree(dir) {
  // Um user-data-dir aceita um único processo Chrome. Se o usuário deixou a
  // janela aberta, o launch falha com uma mensagem críptica — antecipamos.
  for (const lock of ["SingletonLock", "SingletonCookie", "lockfile"]) {
    if (fs.existsSync(path.join(dir, lock))) {
      log.warn(`[browser] lock encontrado (${lock}) em ${dir} — pode haver Chrome aberto neste perfil`);
      return;
    }
  }
}

async function doLaunch() {
  const { chromium } = await import("playwright-core");

  if (config.cdpEndpoint) {
    // Escape hatch: MFA por passkey / Windows Hello pode falhar num Chrome
    // dirigido. Aqui o usuário sobe o próprio Chrome com --remote-debugging-port
    // (num user-data-dir NÃO-padrão — desde o Chrome 136 a flag é ignorada no
    // perfil padrão) e nós apenas anexamos.
    log.info(`[browser] anexando via CDP em ${config.cdpEndpoint}`);
    browser = await chromium.connectOverCDP(config.cdpEndpoint);
    ctx = browser.contexts()[0] || (await browser.newContext());
    mode = "cdp";
  } else {
    fs.mkdirSync(config.userDataDir, { recursive: true });
    assertProfileFree(config.userDataDir);
    log.info(`[browser] abrindo Chrome (channel=${config.channel}) com perfil ${config.userDataDir}`);
    ctx = await chromium.launchPersistentContext(config.userDataDir, {
      channel: config.executablePath ? undefined : config.channel,
      executablePath: config.executablePath,
      headless: config.headless,
      viewport: config.viewport,
      args: LAUNCH_ARGS,
      ignoreDefaultArgs: ["--enable-automation"],
      locale: "pt-BR",
      timezoneId: "America/Sao_Paulo",
    });
    mode = "persistent";
  }

  ctx.setDefaultTimeout(config.actionTimeoutMs);
  ctx.setDefaultNavigationTimeout(config.navigationTimeoutMs);
  ctx.on("close", () => {
    log.warn("[browser] contexto fechado");
    ctx = null;
    browser = null;
    launching = null;
  });

  if (ctx.pages().length === 0) await ctx.newPage();
  return ctx;
}

/** Sobe o navegador se preciso. Concorrentes compartilham a mesma promise. */
export async function getContext() {
  if (ctx) return ctx;
  if (!launching) {
    launching = doLaunch().catch((err) => {
      launching = null;
      throw err;
    });
  }
  return launching;
}

/** Página ativa — a última que recebeu foco, ou a primeira aberta. */
export async function getPage() {
  const c = await getContext();
  const pages = c.pages().filter((p) => !p.isClosed());
  if (pages.length === 0) return c.newPage();
  return activePage && !activePage.isClosed() && pages.includes(activePage) ? activePage : pages[pages.length - 1];
}

let activePage = null;
export const setActivePage = (p) => {
  activePage = p;
};

export const isRunning = () => Boolean(ctx);
export const getMode = () => mode;

export async function closeBrowser() {
  try {
    if (mode === "cdp" && browser) await browser.close();
    else if (ctx) await ctx.close();
  } catch (err) {
    log.warn("[browser] erro ao fechar:", err);
  } finally {
    ctx = null;
    browser = null;
    launching = null;
    activePage = null;
  }
}

// Windows não tem SIGTERM de verdade; o fim do stdin é o sinal confiável de que
// o cliente MCP encerrou. Sem isto o lock do user-data-dir fica preso.
let cleaned = false;
const cleanup = () => {
  if (cleaned) return;
  cleaned = true;
  closeBrowser();
};
process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});
