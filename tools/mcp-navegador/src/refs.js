/**
 * refs.js — snapshot de acessibilidade com refs, e resolução de ref → locator.
 *
 * Usa a API pública do playwright-core 1.60: `ariaSnapshot({ mode: "ai" })`
 * devolve YAML com `[ref=e12]` em cada elemento e ATRAVESSA iframes (refs
 * `f1e12` = elemento e12 dentro do frame 1). O selector engine `aria-ref=`
 * resolve essas refs de volta, inclusive as de dentro de frame.
 */

import { config } from "./config.js";

export class StaleRefError extends Error {
  constructor(ref) {
    super(`ref "${ref}" não existe mais nesta página`);
    this.code = "STALE_REF";
    this.ref = ref;
  }
}

const REF_RE = /^f?\d*e\d+$/;

/** Converte um ref (`e12` ou `f1e12`) num Locator, validando que ainda existe. */
export async function locatorFor(page, ref, description) {
  if (!REF_RE.test(String(ref || ""))) {
    throw new StaleRefError(ref);
  }
  const loc = page.locator(`aria-ref=${ref}`);
  const n = await loc.count().catch(() => 0);
  if (n === 0) throw new StaleRefError(ref);
  return description ? loc.describe(description) : loc;
}

/**
 * Snapshot da página. `maxChars` existe porque o Azure Portal e o LMS geram
 * árvores enormes — devolver tudo queima contexto sem ganho.
 */
export async function snapshot(page, { selector, depth, boxes = false, maxChars = 40000 } = {}) {
  const target = selector ? page.locator(selector) : page;
  const raw = await target.ariaSnapshot({ mode: "ai", boxes, depth, timeout: config.actionTimeoutMs });
  const refCount = (raw.match(/\[ref=/g) || []).length;
  const truncated = raw.length > maxChars;
  return {
    snapshot: truncated ? `${raw.slice(0, maxChars)}\n… [truncado — use \`selector\` ou \`depth\` para focar]` : raw,
    truncated,
    refCount,
  };
}

/** Snapshot enxuto devolvido depois de uma ação mutadora. */
export async function autoSnapshot(page, wanted) {
  if (wanted === "none") return undefined;
  try {
    const { snapshot: s } = await snapshot(page, { maxChars: 12000 });
    return s;
  } catch {
    return undefined; // navegação em curso: não é erro, só não há snapshot útil
  }
}

/** Nome acessível + texto próximo — insumo da camada 2 do risk.js. */
export async function describeTarget(page, ref) {
  try {
    const loc = page.locator(`aria-ref=${ref}`);
    const [name, text, tag, type] = await Promise.all([
      loc.getAttribute("aria-label").catch(() => null),
      loc.innerText({ timeout: 2000 }).catch(() => ""),
      loc.evaluate((el) => el.tagName?.toLowerCase() || "", { timeout: 2000 }).catch(() => ""),
      loc.getAttribute("type").catch(() => null),
    ]);
    return { name: name || "", text: (text || "").slice(0, 400), tag, type: type || "" };
  } catch {
    return { name: "", text: "", tag: "", type: "" };
  }
}
