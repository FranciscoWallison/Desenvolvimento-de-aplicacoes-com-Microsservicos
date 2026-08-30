/**
 * extract.js — HTML da página → Markdown limpo.
 *
 * Tudo roda NO NODE, não na página: `page.content()` traz o HTML, e o parse
 * acontece aqui com linkedom + Readability + turndown. Isso é deliberado — o
 * Azure Portal tem CSP estrito e injetar Readability via `addScriptTag` seria
 * bloqueado. Como bônus, não deixamos rastro no DOM da página.
 */

import { log } from "./log.js";

let deps = null;
async function getDeps() {
  if (deps) return deps;
  const [{ parseHTML }, { Readability }, TurndownMod] = await Promise.all([
    import("linkedom"),
    import("@mozilla/readability"),
    import("turndown"),
  ]);
  const Turndown = TurndownMod.default || TurndownMod;
  const td = new Turndown({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-", emDelimiter: "*" });
  td.addRule("stripNoise", {
    filter: ["script", "style", "noscript", "svg", "iframe"],
    replacement: () => "",
  });
  deps = { parseHTML, Readability, td };
  return deps;
}

/**
 * @param {string} html   HTML completo da página
 * @param {string} url    URL de origem (Readability usa para resolver links)
 * @param {"readable"|"page"} scope
 * @param {"markdown"|"text"|"html"} mode
 */
export async function htmlToDoc(html, url, { scope = "readable", mode = "markdown", maxChars = 60000 } = {}) {
  const { parseHTML, Readability, td } = await getDeps();
  const { document } = parseHTML(html);

  let title = document.querySelector("title")?.textContent?.trim() || "";
  let byline = "";
  let excerpt = "";
  let contentHtml = document.body?.innerHTML || html;

  if (scope === "readable") {
    try {
      // Readability muta o documento — por isso reparseamos numa cópia.
      const { document: doc2 } = parseHTML(html);
      const article = new Readability(doc2, { charThreshold: 200 }).parse();
      if (article?.content) {
        contentHtml = article.content;
        title = article.title || title;
        byline = article.byline || "";
        excerpt = article.excerpt || "";
      } else {
        log.debug("[extract] Readability não encontrou artigo — usando a página inteira");
      }
    } catch (err) {
      log.warn("[extract] Readability falhou, caindo para a página inteira:", err);
    }
  }

  let content;
  if (mode === "html") content = contentHtml;
  else if (mode === "text") content = stripTags(contentHtml);
  else content = td.turndown(contentHtml).replace(/\n{3,}/g, "\n\n").trim();

  const truncated = content.length > maxChars;
  if (truncated) content = `${content.slice(0, maxChars)}\n\n… [truncado em ${maxChars} caracteres]`;

  return {
    title,
    byline,
    excerpt,
    url,
    wordCount: content.split(/\s+/).filter(Boolean).length,
    content,
    truncated,
  };
}

function stripTags(html) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Cabeçalho de proveniência para o .md gravado — de onde veio e quando. */
export function provenanceHeader({ title, url, capturedAt }) {
  return [
    "<!--",
    `  Capturado automaticamente pelo MCP 'navegador'.`,
    `  Origem: ${url}`,
    `  Em: ${capturedAt}`,
    "  Revise antes de commitar: pode conter dados de conta.",
    "-->",
    "",
    `# ${title || "Sem título"}`,
    "",
    `> **Fonte:** ${url}`,
    "",
    "---",
    "",
  ].join("\n");
}
