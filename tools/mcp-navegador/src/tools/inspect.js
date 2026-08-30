import { z } from "zod";
import { config } from "../config.js";
import { getPage } from "../browser.js";
import { locatorFor, snapshot } from "../refs.js";
import { htmlToDoc, provenanceHeader } from "../extract.js";
import { saveDoc } from "../evidence.js";
import { checkEvalSource } from "../risk.js";
import { fail, guard, handler, ok } from "./_shared.js";

export function register(server) {
  server.registerTool(
    "browser_snapshot",
    {
      title: "Snapshot de acessibilidade",
      description:
        "Árvore de acessibilidade da página em YAML, com refs `[ref=e12]` em cada elemento — é daqui que saem os refs usados por browser_click/type/hover. Atravessa iframes automaticamente (refs `f1e12`). Use `selector` ou `depth` para focar numa região e economizar contexto.",
      inputSchema: {
        selector: z.string().optional().describe("CSS para limitar o snapshot a uma região"),
        depth: z.number().int().positive().optional().describe("profundidade máxima da árvore"),
        boxes: z.boolean().optional().describe("incluir bounding box de cada elemento"),
        maxChars: z.number().int().positive().max(200000).optional(),
      },
    },
    handler("browser_snapshot", async ({ selector, depth, boxes = false, maxChars = 40000 }) => {
      const page = await getPage();
      const res = await snapshot(page, { selector, depth, boxes, maxChars });
      return ok({ url: page.url(), title: await page.title().catch(() => ""), ...res });
    }),
  );

  server.registerTool(
    "browser_extract",
    {
      title: "Extrair conteúdo",
      description:
        "Converte a página (ou parte dela) em Markdown/texto limpo — para transformar uma aula ou documentação em nota de estudo. Com `saveTo`, grava direto um .md dentro da raiz de documentação e devolve o caminho.",
      inputSchema: {
        mode: z.enum(["markdown", "text", "html"]).optional(),
        scope: z.enum(["readable", "page", "selector", "ref"]).optional().describe("`readable` usa Readability e tira menu/rodapé"),
        selector: z.string().optional(),
        ref: z.string().optional(),
        maxChars: z.number().int().positive().max(400000).optional(),
        saveTo: z.string().optional().describe("caminho .md relativo a MCP_NAV_DOCS_ROOT, ex.: Devops/Cloud/Azure-Academy/aula-01.md"),
        withProvenance: z.boolean().optional().describe("prefixar cabeçalho com origem/data (padrão: true quando saveTo é usado)"),
      },
    },
    handler("browser_extract", async ({ mode = "markdown", scope = "readable", selector, ref, maxChars = 60000, saveTo, withProvenance }) => {
      const page = await getPage();
      const url = page.url();

      let html;
      if (scope === "selector" && selector) html = await page.locator(selector).first().evaluate((el) => el.outerHTML);
      else if (scope === "ref" && ref) html = await (await locatorFor(page, ref)).evaluate((el) => el.outerHTML);
      else html = await page.content();

      const doc = await htmlToDoc(html, url, { scope: scope === "readable" ? "readable" : "page", mode, maxChars });

      let savedPath;
      if (saveTo) {
        const wantHeader = withProvenance !== false;
        const body = wantHeader ? provenanceHeader({ title: doc.title, url, capturedAt: new Date().toISOString() }) + doc.content : doc.content;
        savedPath = saveDoc(saveTo, body);
      }
      return ok({ ...doc, savedPath });
    }),
  );

  server.registerTool(
    "browser_evaluate",
    {
      title: "Executar JS (restrito)",
      description:
        "Executa JavaScript na página para LER o DOM. Desabilitado por padrão (MCP_NAV_ALLOW_EVAL=0); mesmo habilitado exige confirmação humana e rejeita padrões de ação (fetch, cookie, storage, click, navegação).",
      inputSchema: {
        function: z.string().describe("expressão de função, ex.: `() => document.querySelectorAll('li').length`"),
        ref: z.string().optional().describe("se informado, a função recebe o elemento como argumento"),
        confirmToken: z.string().optional(),
      },
    },
    handler("browser_evaluate", async ({ function: src, ref, confirmToken }) => {
      if (!config.allowEval) {
        return fail({
          code: "EVAL_DISABLED",
          message: "browser_evaluate está desabilitado.",
          hint: "Para habilitar, defina MCP_NAV_ALLOW_EVAL=1 no env do servidor e reinicie. Na maioria dos casos browser_snapshot ou browser_extract resolvem sem precisar disso.",
        });
      }
      const pre = checkEvalSource(src);
      if (!pre.ok) return fail({ code: "EVAL_FORBIDDEN", message: pre.reason });

      const g = await guard({ tool: "browser_evaluate", ref, element: "script", confirmToken, needLocator: Boolean(ref) });
      if (g.blocked) return g.blocked;

      const result = ref ? await g.locator.evaluate(new Function(`return (${src})`)()) : await g.page.evaluate(new Function(`return (${src})`)());
      return ok({ result });
    }),
  );
}
