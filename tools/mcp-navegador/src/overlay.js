/**
 * overlay.js — banner de aprovação injetado na própria página.
 *
 * A confirmação acontece onde o usuário já está olhando: o navegador. Sem UI
 * extra, sem terminal paralelo.
 *
 * Por que é imune ao CSP: `page.evaluate(fn)` roda via CDP `Runtime.callFunctionOn`,
 * que não passa pelo `eval` nem por `<script>` da página. O Azure Portal tem CSP
 * estrito e bloquearia `addScriptTag` — este caminho não.
 */

const HOST_ID = "__mcp_navegador_overlay__";

/* eslint-env browser */
function renderOverlay(opts) {
  const { hostId, title, action, reason, buttons } = opts;
  document.getElementById(hostId)?.remove();

  const host = document.createElement("div");
  host.id = hostId;
  host.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147483647;";
  // Shadow DOM: o CSS da página não vaza para dentro do banner, nem o contrário.
  const root = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    .bar{font:14px/1.45 system-ui,Segoe UI,sans-serif;background:#1b1f23;color:#fff;
         padding:14px 18px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;
         box-shadow:0 3px 14px rgba(0,0,0,.45);border-bottom:3px solid #f0a500}
    .txt{flex:1;min-width:280px}
    .t{font-weight:700;color:#f0a500;margin-bottom:3px}
    .a{font-weight:600;word-break:break-word}
    .r{opacity:.72;font-size:12px;margin-top:3px}
    button{font:600 14px system-ui,sans-serif;padding:9px 20px;border:0;border-radius:6px;cursor:pointer}
    .ok{background:#2ea043;color:#fff}
    .no{background:#3a3f45;color:#fff}
  `;

  const bar = document.createElement("div");
  bar.className = "bar";
  const txt = document.createElement("div");
  txt.className = "txt";
  const t = document.createElement("div");
  t.className = "t";
  t.textContent = title;
  const a = document.createElement("div");
  a.className = "a";
  a.textContent = action;
  const r = document.createElement("div");
  r.className = "r";
  r.textContent = reason || "";
  txt.append(t, a, r);

  const ok = document.createElement("button");
  ok.className = "ok";
  ok.textContent = buttons[0];
  const no = document.createElement("button");
  no.className = "no";
  no.textContent = buttons[1];

  ok.addEventListener("click", () => {
    window.__mcpNavDecision = "approved";
    host.remove();
  });
  no.addEventListener("click", () => {
    window.__mcpNavDecision = "rejected";
    host.remove();
  });

  bar.append(txt, ok, no);
  root.append(style, bar);
  document.documentElement.appendChild(host);
  window.__mcpNavDecision = "waiting";
  return true;
}

/** Mostra o banner. Retorna false se a página não aceitar injeção. */
export async function showOverlay(page, { title = "Confirmação necessária", action, reason, buttons = ["Aprovar", "Recusar"] }) {
  try {
    await page.evaluate(renderOverlay, { hostId: HOST_ID, title, action, reason, buttons });
    return true;
  } catch {
    return false; // about:blank, viewer de PDF, navegação em curso
  }
}

/** Lê a decisão. `null` = o banner sumiu (navegação) e precisa ser reinjetado. */
export async function readDecision(page) {
  try {
    return await page.evaluate((hostId) => {
      const present = Boolean(document.getElementById(hostId));
      const d = window.__mcpNavDecision;
      if (d === "approved" || d === "rejected") return d;
      return present ? "waiting" : null;
    }, HOST_ID);
  } catch {
    return null;
  }
}

export async function clearOverlay(page) {
  try {
    await page.evaluate((hostId) => {
      document.getElementById(hostId)?.remove();
      delete window.__mcpNavDecision;
    }, HOST_ID);
  } catch {
    /* página já saiu de baixo */
  }
}
