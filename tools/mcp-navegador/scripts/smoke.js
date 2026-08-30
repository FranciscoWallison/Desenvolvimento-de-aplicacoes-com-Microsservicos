/**
 * smoke.js — teste ponta a ponta com navegador de verdade.
 *
 * Sobe o Chrome, navega para uma página pública, tira snapshot, captura
 * evidência e extrai Markdown. Valida browser.js, refs.js, evidence.js e
 * extract.js juntos, sem precisar de login.
 *
 * Uso:  node scripts/smoke.js [url]
 * Os artefatos vão para state/smoke/ (gitignored), não para a documentação.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ⚠️ As env vars TÊM de ser definidas antes de `config.js` ser importado —
// imports estáticos são içados e avaliados primeiro. Por isso config entra
// aqui por import dinâmico, depois destas linhas.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "..", "state", "smoke");
// Idempotência: as asserções de sequência esperam pasta vazia. Sem esta limpeza,
// uma segunda execução acha as capturas da primeira e (corretamente!) continua
// em 03/04 — o produto acerta e o teste é que dava falso negativo.
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
process.env.MCP_NAV_DOCS_ROOT = OUT;
process.env.MCP_NAV_DEFAULT_DOCS_DIR = ".";

const { config } = await import("../src/config.js");

const URL_ALVO = process.argv[2] || "https://www.azureacademy.com.br/";

const say = (okFlag, msg) => process.stderr.write(`${okFlag ? "PASS" : "FALHOU"}  ${msg}\n`);
let pass = true;
const check = (c, m) => {
  if (!c) pass = false;
  say(c, m);
};

const { getContext, getPage, closeBrowser } = await import("../src/browser.js");
const { snapshot } = await import("../src/refs.js");
const { htmlToDoc } = await import("../src/extract.js");
const { slugify, saveShot, nextSeq } = await import("../src/evidence.js");
const { isHumanOnlyZone, classify } = await import("../src/risk.js");

// ── slugify: precisa tirar acento, senão o nome do arquivo vira loteria ───────
check(slugify("Organização & Cobrança") === "organizacao-cobranca", `slugify tira acentos → "${slugify("Organização & Cobrança")}"`);

// ── camada 1 do trilho: zonas humanas ────────────────────────────────────────
check(isHumanOnlyZone("https://login.microsoftonline.com/common/oauth2"), "login.microsoftonline.com é zona humana");
check(isHumanOnlyZone("https://labs.azureacademy.com.br/matricula/login"), "tela de login do LMS é zona humana");
check(!isHumanOnlyZone("https://dev.azure.com/minhaorg/_settings"), "dev.azure.com comum NÃO é zona humana");

const t0 = Date.now();
try {
  await getContext();
  check(true, `Chrome subiu em ${Date.now() - t0} ms`);

  const page = await getPage();
  const resp = await page.goto(URL_ALVO, { waitUntil: "domcontentloaded", timeout: 60000 });
  check((resp?.status() ?? 0) < 400, `navegou para ${URL_ALVO} (HTTP ${resp?.status()})`);

  const snap = await snapshot(page, { maxChars: 8000 });
  check(snap.refCount > 0, `snapshot com refs — ${snap.refCount} elementos referenciáveis`);
  const primeiroRef = /\[ref=(f?\d*e\d+)\]/.exec(snap.snapshot)?.[1];
  check(Boolean(primeiroRef), `refs no formato esperado (primeiro: ${primeiroRef})`);

  if (primeiroRef) {
    const loc = page.locator(`aria-ref=${primeiroRef}`);
    check((await loc.count()) === 1, `selector aria-ref= resolve o ref ${primeiroRef} de volta`);
  }

  // ── camada 2: um botão "Comprar" tem de exigir confirmação ──────────────────
  const veredito = await classify({ page, tool: "browser_click", ref: null, element: "botão Set up billing" });
  check(veredito.risk === "confirm", `ação de billing classificada como "${veredito.risk}" (esperado: confirm)`);
  const inocente = await classify({ page, tool: "browser_click", ref: null, element: "link Sobre nós" });
  check(inocente.risk === "allow", `ação inócua classificada como "${inocente.risk}" (esperado: allow)`);

  // ── evidência ──────────────────────────────────────────────────────────────
  const buf = await page.screenshot({ type: "png", mask: [page.locator("input[type=password]")] });
  const shot = saveShot(buf, { lesson: "smoke-test", slug: "pagina inicial", docsDir: ".", alt: "página inicial" });
  check(fs.existsSync(shot.absPath), `screenshot gravado: ${path.basename(shot.absPath)} (${shot.bytes} bytes)`);
  check(shot.relativePath === "imgs/smoke-test_01_pagina-inicial.png", `nome/caminho relativo corretos → ${shot.relativePath}`);
  check(shot.markdown.startsWith("!["), `markdown pronto para colar → ${shot.markdown}`);

  const shot2 = saveShot(buf, { lesson: "smoke-test", slug: "segunda", docsDir: "." });
  check(shot2.seq === 2, `sequência incrementa lendo o disco (2ª captura → seq ${shot2.seq})`);
  check(nextSeq(path.join(OUT, "imgs"), "smoke-test") === 3, "nextSeq() aponta para o próximo número livre");

  // ── extração ───────────────────────────────────────────────────────────────
  const doc = await htmlToDoc(await page.content(), page.url(), { scope: "readable", mode: "markdown", maxChars: 20000 });
  check(doc.content.length > 100, `extract gerou Markdown (${doc.wordCount} palavras, título: "${doc.title.slice(0, 50)}")`);
  check(!/<script/i.test(doc.content), "Markdown sem <script> residual");
} catch (err) {
  pass = false;
  process.stderr.write(`\nERRO: ${err?.stack || err}\n`);
} finally {
  await closeBrowser();
}

process.stderr.write(`\nArtefatos em: ${OUT}\n${pass ? "TUDO OK" : "HÁ FALHAS"}\n`);
process.exit(pass ? 0 : 1);
