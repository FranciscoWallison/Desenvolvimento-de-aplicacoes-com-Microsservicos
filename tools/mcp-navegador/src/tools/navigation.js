import { z } from "zod";
import { config } from "../config.js";
import { getContext, getMode, getPage, isRunning, setActivePage } from "../browser.js";
import { autoSnapshot } from "../refs.js";
import { after, handler, ok } from "./_shared.js";

/** Heurística de sessão: olha só a URL e marcadores de DOM público.
 *  Nunca lê cookie de autenticação — não há tool que exporte sessão. */
async function loginState(ctx) {
  const urls = ctx
    .pages()
    .filter((p) => !p.isClosed())
    .map((p) => p.url());
  const any = (frag) => urls.some((u) => u.includes(frag));
  return {
    lms: any("labs.azureacademy.com.br") && !any("/matricula/login"),
    azure: any("portal.azure.com") && !any("login.microsoftonline.com"),
    devops: any("dev.azure.com") && !any("login.microsoftonline.com"),
  };
}

export function register(server) {
  server.registerTool(
    "browser_status",
    {
      title: "Estado do navegador",
      description:
        "Estado atual do navegador dirigido por este servidor: se está aberto, abas, URL ativa, modo (perfil persistente ou CDP) e uma heurística de sessão por site. Abre o Chrome se ainda não estiver aberto.",
      inputSchema: {
        include: z.array(z.enum(["tabs", "loggedIn"])).optional().describe("blocos extras a incluir; por padrão vêm todos"),
      },
    },
    handler("browser_status", async () => {
      const ctx = await getContext();
      const page = await getPage();
      setActivePage(page);
      const pages = ctx.pages().filter((p) => !p.isClosed());
      return ok({
        running: isRunning(),
        mode: getMode(),
        url: page.url(),
        title: await page.title().catch(() => ""),
        profileDir: config.cdpEndpoint ? `(CDP ${config.cdpEndpoint})` : config.userDataDir,
        viewport: config.viewport,
        docsRoot: config.docsRoot,
        defaultDocsDir: config.defaultDocsDir,
        tabs: await Promise.all(pages.map(async (p, i) => ({ index: i, url: p.url(), title: await p.title().catch(() => ""), active: p === page }))),
        loggedIn: await loginState(ctx),
      });
    }),
  );

  server.registerTool(
    "browser_navigate",
    {
      title: "Abrir URL",
      description: "Navega para uma URL (abre o Chrome se preciso). Devolve um snapshot de acessibilidade da página resultante.",
      inputSchema: {
        url: z.string().describe("URL completa, com protocolo"),
        waitUntil: z.enum(["load", "domcontentloaded", "networkidle", "commit"]).optional(),
        timeoutMs: z.number().int().positive().optional(),
        newTab: z.boolean().optional().describe("abrir numa aba nova em vez de reaproveitar a ativa"),
        snapshot: z.enum(["auto", "none"]).optional(),
      },
    },
    handler("browser_navigate", async ({ url, waitUntil = "domcontentloaded", timeoutMs, newTab = false, snapshot: snapWanted = "auto" }) => {
      const ctx = await getContext();
      const page = newTab ? await ctx.newPage() : await getPage();
      setActivePage(page);
      const resp = await page.goto(url, { waitUntil, timeout: timeoutMs || config.navigationTimeoutMs });
      return ok(
        await after(page, snapWanted, {
          title: await page.title().catch(() => ""),
          status: resp?.status() ?? null,
          redirected: resp ? resp.url() !== url : false,
        }),
      );
    }),
  );

  server.registerTool(
    "browser_navigate_history",
    {
      title: "Voltar/avançar",
      description: "Navega no histórico da aba ativa.",
      inputSchema: {
        direction: z.enum(["back", "forward"]),
        steps: z.number().int().positive().max(10).optional(),
        snapshot: z.enum(["auto", "none"]).optional(),
      },
    },
    handler("browser_navigate_history", async ({ direction, steps = 1, snapshot: snapWanted = "auto" }) => {
      const page = await getPage();
      for (let i = 0; i < steps; i++) {
        if (direction === "back") await page.goBack({ waitUntil: "domcontentloaded" });
        else await page.goForward({ waitUntil: "domcontentloaded" });
      }
      return ok(await after(page, snapWanted, { title: await page.title().catch(() => "") }));
    }),
  );

  server.registerTool(
    "browser_tabs",
    {
      title: "Abas",
      description: "Lista, seleciona, abre ou fecha abas.",
      inputSchema: {
        action: z.enum(["list", "select", "new", "close"]),
        index: z.number().int().min(0).optional().describe("índice da aba, para select/close"),
        url: z.string().optional().describe("URL inicial, para action=new"),
      },
    },
    handler("browser_tabs", async ({ action, index, url }) => {
      const ctx = await getContext();
      let pages = ctx.pages().filter((p) => !p.isClosed());

      if (action === "new") {
        const p = await ctx.newPage();
        if (url) await p.goto(url, { waitUntil: "domcontentloaded" });
        setActivePage(p);
      } else if (action === "select") {
        const p = pages[index];
        if (!p) return ok({ error: `aba ${index} não existe`, count: pages.length });
        await p.bringToFront();
        setActivePage(p);
      } else if (action === "close") {
        const p = pages[index];
        if (!p) return ok({ error: `aba ${index} não existe`, count: pages.length });
        await p.close();
      }

      pages = ctx.pages().filter((p) => !p.isClosed());
      const active = await getPage();
      return ok({
        tabs: await Promise.all(pages.map(async (p, i) => ({ index: i, url: p.url(), title: await p.title().catch(() => ""), active: p === active }))),
      });
    }),
  );
}

export { autoSnapshot };
