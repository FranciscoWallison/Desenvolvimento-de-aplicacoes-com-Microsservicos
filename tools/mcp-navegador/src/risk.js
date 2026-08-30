/**
 * risk.js — trilhos de segurança: deny → confirm → allow.
 *
 * Avaliado NO SERVIDOR, antes de qualquer ação. O julgamento do assistente não
 * entra na decisão: se ele "achar" que pode clicar em Set up billing, o servidor
 * ainda assim exige a aprovação humana.
 */

import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import { log } from "./log.js";
import { describeTarget } from "./refs.js";

let policies = null;

function loadPolicies() {
  if (policies) return policies;
  const read = (f, dflt) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(config.policyDir, f), "utf8"));
    } catch (err) {
      log.error(`[risk] falha ao ler policy/${f} — aplicando o padrão MAIS restritivo`, err);
      return dflt;
    }
  };
  const auth = read("auth-hosts.json", { hardDeny: ["login.microsoftonline.com"], forbiddenFieldSelectors: ["input[type=password]"] });
  const deny = read("denylist.json", { confirmPatterns: ["billing", "pagamento", "delete", "excluir"], notePatterns: [] });
  const domain = read("domain-rules.json", { rules: [{ host: "*", tools: ["browser_evaluate"], reason: "fallback" }] });

  policies = {
    hardDeny: auth.hardDeny || [],
    forbiddenFieldSelectors: auth.forbiddenFieldSelectors || [],
    confirmRes: (deny.confirmPatterns || []).map((p) => new RegExp(p, "i")),
    noteRes: (deny.notePatterns || []).map((p) => new RegExp(p, "i")),
    rules: domain.rules || [],
  };
  return policies;
}

/** Casamento de host com suporte a `*` no início e a caminho embutido. */
function hostMatches(pattern, url) {
  if (pattern === "*") return true;
  const target = url.replace(/^https?:\/\//, "");
  if (pattern.startsWith("*.")) {
    const suffix = pattern.slice(1); // ".b2clogin.com"
    const host = target.split("/")[0];
    return host.endsWith(suffix);
  }
  return target.startsWith(pattern) || target.split("/")[0] === pattern;
}

/** Camada 1 — a URL atual é zona exclusivamente humana? */
export function isHumanOnlyZone(url) {
  const p = loadPolicies();
  return p.hardDeny.some((h) => hostMatches(h, url || ""));
}

/** Campos que nenhuma tool preenche, em nenhuma URL. */
export async function isForbiddenField(page, ref) {
  const p = loadPolicies();
  try {
    const loc = page.locator(`aria-ref=${ref}`);
    return await loc.evaluate(
      (el, selectors) => selectors.some((s) => { try { return el.matches(s); } catch { return false; } }),
      p.forbiddenFieldSelectors,
      { timeout: 2000 },
    );
  } catch {
    return false;
  }
}

/**
 * Classifica uma ação.
 * @returns {{risk:"allow"|"confirm"|"deny", reason?:string, action?:string}}
 */
export async function classify({ page, tool, ref, element }) {
  const p = loadPolicies();
  const url = page ? page.url() : "";

  // ── Camada 1: hard deny. Nenhum token libera. ───────────────────────────────
  if (isHumanOnlyZone(url)) {
    return {
      risk: "deny",
      reason: "human-only-zone",
      action: `${tool} em ${url}`,
      hint: "Esta é uma tela de login/MFA/pagamento. Só o usuário age aqui — use wait_for_login e aguarde.",
    };
  }

  // ── Camada 3: regras por domínio + ação ────────────────────────────────────
  for (const rule of p.rules) {
    if (!hostMatches(rule.host, url)) continue;
    if (rule.urlContains && !url.includes(rule.urlContains)) continue;
    if (rule.tools && !rule.tools.includes(tool)) continue;
    if (rule.textMatches) {
      const hay = `${element || ""}`;
      if (!new RegExp(rule.textMatches, "i").test(hay)) continue;
    }
    return { risk: "confirm", reason: `domain-rule:${rule.reason || rule.host}`, action: describeAction(tool, element, url) };
  }

  // ── Camada 2: texto acessível do alvo ──────────────────────────────────────
  // A descrição que o assistente passou em `element` entra SEMPRE no exame,
  // mesmo sem ref e mesmo que a leitura do DOM falhe. Se dependêssemos só do
  // texto lido da página, um describeTarget que estourasse o timeout (nó
  // destacado, SPA re-renderizando) deixaria passar um clique em "Comprar".
  let hay = String(element || "");
  if (ref && page) {
    const info = await describeTarget(page, ref);
    hay = `${info.name} ${info.text} ${hay}`.trim();
  }
  if (hay) {
    const hit = p.confirmRes.find((re) => re.test(hay));
    if (hit) {
      return { risk: "confirm", reason: `denylist:${hit.source}`, action: describeAction(tool, element || hay.slice(0, 60), url) };
    }
    const note = p.noteRes.find((re) => re.test(hay));
    if (note) log.info(`[risk] ação de baixo risco anotada (${note.source}): ${tool} ${element || ""}`);
  }

  // Regra 3 já cobre browser_evaluate, mas garantimos aqui também.
  if (tool === "browser_evaluate") {
    return { risk: "confirm", reason: "evaluate", action: describeAction(tool, element, url) };
  }

  return { risk: "allow" };
}

function describeAction(tool, element, url) {
  const verb =
    { browser_click: "clicar em", browser_type: "digitar em", browser_select_option: "selecionar em", browser_evaluate: "executar JS em" }[tool] || tool;
  return `${verb} ${element ? `"${element}"` : "elemento"} — ${url}`;
}

/** Pré-filtro do browser_evaluate: leitura de DOM sim, ação não. */
const EVAL_FORBIDDEN = [
  /\bfetch\s*\(/,
  /XMLHttpRequest/,
  /document\.cookie/,
  /localStorage/,
  /sessionStorage/,
  /indexedDB/,
  /\.submit\s*\(/,
  /location\s*(\.href)?\s*=/,
  /location\.(assign|replace)\s*\(/,
  /window\.open/,
  /\.click\s*\(/,
  /navigator\.credentials/,
  /import\s*\(/,
];

export function checkEvalSource(src) {
  const hit = EVAL_FORBIDDEN.find((re) => re.test(src));
  if (hit) {
    return { ok: false, reason: `browser_evaluate é para LER o DOM, não para agir. Padrão proibido: ${hit.source}` };
  }
  return { ok: true };
}
