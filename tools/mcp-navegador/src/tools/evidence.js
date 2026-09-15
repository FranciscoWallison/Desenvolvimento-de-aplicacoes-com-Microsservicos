import { z } from "zod";
import { config } from "../config.js";
import { getPage } from "../browser.js";
import { locatorFor } from "../refs.js";
import { saveShot } from "../evidence.js";
import { handler, ok } from "./_shared.js";

/** Seletores do "account chip" do Azure Portal / Azure DevOps / LMS.
 *  Estas capturas vão para um GitHub público — e-mail e tenant não deveriam ir junto. */
const ACCOUNT_SELECTORS = [
  "#mectrl_main_trigger",
  "#meControl",
  ".fxs-avatarmenu",
  "#fxs-avatarmenu-button",
  "[data-testid='user-menu']",
  ".bolt-header-command-item-button[aria-label*='avatar' i]",
  "#O365_MainLink_Me",
];

export function register(server) {
  server.registerTool(
    "browser_screenshot",
    {
      title: "Capturar evidência",
      description:
        "Tira um screenshot e o grava direto na pasta de imagens da documentação, com nome sequencial por lição. Devolve o caminho relativo e o snippet Markdown pronto para colar no .md. Por padrão NÃO devolve os bytes da imagem (economiza contexto) — passe returnImage:true só quando precisar realmente ver a tela.",
      inputSchema: {
        slug: z.string().describe("o que a captura mostra, em poucas palavras — vira parte do nome do arquivo, ex.: 'organization-settings-billing'"),
        lesson: z.string().optional().describe("nome do .md sem extensão, ex.: '02-ativar-agent-pool' (padrão: MCP_NAV_DEFAULT_DOCS_DIR)"),
        alt: z.string().optional().describe("texto alternativo do Markdown"),
        scope: z.enum(["viewport", "fullPage", "element"]).optional(),
        ref: z.string().optional().describe("obrigatório quando scope=element"),
        docsDir: z.string().optional().describe("pasta do .md, relativa a MCP_NAV_DOCS_ROOT"),
        seq: z.number().int().positive().optional().describe("forçar o número da sequência; por padrão é calculado lendo a pasta"),
        maskRefs: z.array(z.string()).optional().describe("refs a borrar na imagem"),
        maskAccount: z.boolean().optional().describe("borrar o menu de conta (padrão: true)"),
        returnImage: z.boolean().optional(),
      },
    },
    handler("browser_screenshot", async ({ slug, lesson, alt, scope = "viewport", ref, docsDir, seq, maskRefs = [], maskAccount = true, returnImage = false }) => {
      const page = await getPage();

      const mask = [];
      // Campos de senha nunca aparecem numa captura, mesmo preenchidos pelo usuário.
      mask.push(page.locator("input[type=password]"));
      if (maskAccount) for (const sel of ACCOUNT_SELECTORS) mask.push(page.locator(sel));
      for (const r of maskRefs) mask.push(await locatorFor(page, r).catch(() => null));

      const opts = {
        type: "png",
        mask: mask.filter(Boolean),
        maskColor: "#4b5563",
        animations: "disabled",
        timeout: 30000,
      };

      let buffer;
      if (scope === "element") {
        if (!ref) return ok({ error: "scope=element exige `ref`" });
        buffer = await (await locatorFor(page, ref)).screenshot(opts);
      } else {
        buffer = await page.screenshot({ ...opts, fullPage: scope === "fullPage" });
      }

      const saved = saveShot(buffer, {
        lesson: lesson || config.defaultDocsDir.split("/").pop(),
        slug,
        seq,
        docsDir,
        alt,
      });

      const payload = { ...saved, scope, url: page.url(), title: await page.title().catch(() => "") };
      if (!returnImage) return ok(payload);
      return {
        content: [
          { type: "text", text: JSON.stringify(payload, null, 2) },
          { type: "image", data: buffer.toString("base64"), mimeType: "image/png" },
        ],
      };
    }),
  );
}
