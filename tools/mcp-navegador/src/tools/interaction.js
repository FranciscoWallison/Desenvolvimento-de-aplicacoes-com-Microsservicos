import { z } from "zod";
import { config, clampWait } from "../config.js";
import { getPage } from "../browser.js";
import { isForbiddenField } from "../risk.js";
import { after, fail, guard, handler, ok } from "./_shared.js";

const refArgs = {
  ref: z.string().describe("ref vindo de um browser_snapshot, ex.: e42 ou f1e42"),
  element: z.string().describe("descrição humana do alvo, ex.: 'botão New organization' — aparece no diálogo de confirmação e nas mensagens de erro"),
};

export function register(server) {
  server.registerTool(
    "browser_click",
    {
      title: "Clicar",
      description: "Clica num elemento identificado por ref. Ações sensíveis (cobrança, exclusão, compra) são interceptadas e exigem confirmação humana antes de executar.",
      inputSchema: {
        ...refArgs,
        button: z.enum(["left", "right", "middle"]).optional(),
        clickCount: z.number().int().min(1).max(3).optional(),
        modifiers: z.array(z.enum(["Alt", "Control", "Shift", "Meta"])).optional(),
        force: z.boolean().optional(),
        confirmToken: z.string().optional(),
        snapshot: z.enum(["auto", "none"]).optional(),
      },
    },
    handler("browser_click", async ({ ref, element, button = "left", clickCount = 1, modifiers, force = false, confirmToken, snapshot: snapWanted = "auto" }) => {
      const g = await guard({ tool: "browser_click", ref, element, confirmToken });
      if (g.blocked) return g.blocked;

      const urlBefore = g.page.url();
      await g.locator.click({ button, clickCount, modifiers, force, timeout: config.actionTimeoutMs });
      // Cliques que navegam precisam de um instante para a SPA reagir.
      await g.page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => {});
      const urlAfter = g.page.url();
      return ok(await after(g.page, snapWanted, { urlChanged: urlBefore !== urlAfter, previousUrl: urlBefore }));
    }),
  );

  server.registerTool(
    "browser_hover",
    {
      title: "Passar o mouse",
      description: "Passa o mouse sobre um elemento — necessário para os menus flutuantes do Azure DevOps e do Azure Portal.",
      inputSchema: { ...refArgs, snapshot: z.enum(["auto", "none"]).optional() },
    },
    handler("browser_hover", async ({ ref, element, snapshot: snapWanted = "auto" }) => {
      const g = await guard({ tool: "browser_hover", ref, element });
      if (g.blocked) return g.blocked;
      await g.locator.hover({ timeout: config.actionTimeoutMs });
      return ok(await after(g.page, snapWanted));
    }),
  );

  server.registerTool(
    "browser_type",
    {
      title: "Digitar",
      description:
        "Digita texto num campo. NUNCA aceita campo de senha, OTP ou similar, em nenhuma URL — essas telas são exclusivas do usuário. O texto digitado não é ecoado na resposta nem no log.",
      inputSchema: {
        ...refArgs,
        text: z.string(),
        clear: z.boolean().optional().describe("limpar o campo antes (padrão: true)"),
        submit: z.boolean().optional().describe("pressionar Enter ao final"),
        slowly: z.boolean().optional().describe("digitar tecla a tecla, para campos com autocomplete reativo"),
        confirmToken: z.string().optional(),
        snapshot: z.enum(["auto", "none"]).optional(),
      },
    },
    handler("browser_type", async ({ ref, element, text, clear = true, submit = false, slowly = false, confirmToken, snapshot: snapWanted = "auto" }) => {
      const page = await getPage();
      // Checagem de campo proibido vem ANTES do guard: vale em qualquer URL.
      if (await isForbiddenField(page, ref)) {
        return fail({
          code: "FORBIDDEN_FIELD",
          message: "Este é um campo de senha/OTP. Nenhuma tool preenche credenciais.",
          hint: "Peça ao usuário para digitar. Use wait_for_login e aguarde ele concluir.",
        });
      }

      const g = await guard({ tool: "browser_type", ref, element, confirmToken });
      if (g.blocked) return g.blocked;

      if (clear) await g.locator.fill("", { timeout: config.actionTimeoutMs });
      if (slowly) await g.locator.pressSequentially(text, { delay: 40, timeout: config.actionTimeoutMs });
      else await g.locator.fill(text, { timeout: config.actionTimeoutMs });
      if (submit) await g.locator.press("Enter");

      // Devolve o comprimento, nunca o conteúdo.
      return ok(await after(g.page, snapWanted, { valueLength: text.length, submitted: submit }));
    }),
  );

  server.registerTool(
    "browser_press_key",
    {
      title: "Pressionar tecla",
      description: "Pressiona uma tecla (Enter, Escape, Tab, ArrowDown, Control+A…), na página ou num elemento.",
      inputSchema: {
        key: z.string().describe("nome da tecla no formato do Playwright, ex.: Enter, Escape, Control+A"),
        ref: z.string().optional(),
        element: z.string().optional(),
        repeat: z.number().int().min(1).max(20).optional(),
        snapshot: z.enum(["auto", "none"]).optional(),
      },
    },
    handler("browser_press_key", async ({ key, ref, element, repeat = 1, snapshot: snapWanted = "auto" }) => {
      const g = await guard({ tool: "browser_press_key", ref, element, needLocator: Boolean(ref) });
      if (g.blocked) return g.blocked;
      for (let i = 0; i < repeat; i++) {
        if (g.locator) await g.locator.press(key, { timeout: config.actionTimeoutMs });
        else await g.page.keyboard.press(key);
      }
      return ok(await after(g.page, snapWanted, { key, repeat }));
    }),
  );

  server.registerTool(
    "browser_select_option",
    {
      title: "Selecionar opção",
      description: "Seleciona uma ou mais opções num <select>.",
      inputSchema: { ...refArgs, values: z.array(z.string()), confirmToken: z.string().optional(), snapshot: z.enum(["auto", "none"]).optional() },
    },
    handler("browser_select_option", async ({ ref, element, values, confirmToken, snapshot: snapWanted = "auto" }) => {
      const g = await guard({ tool: "browser_select_option", ref, element, confirmToken });
      if (g.blocked) return g.blocked;
      const selected = await g.locator.selectOption(values, { timeout: config.actionTimeoutMs });
      return ok(await after(g.page, snapWanted, { selected }));
    }),
  );

  server.registerTool(
    "browser_scroll",
    {
      title: "Rolar",
      description: "Rola a página ou um contêiner. Útil antes de capturar evidência de uma seção fora da viewport.",
      inputSchema: {
        direction: z.enum(["down", "up", "top", "bottom"]),
        amount: z.union([z.literal("page"), z.literal("half"), z.number()]).optional(),
        ref: z.string().optional().describe("rolar dentro deste elemento em vez da janela"),
      },
    },
    handler("browser_scroll", async ({ direction, amount = "page", ref }) => {
      const g = await guard({ tool: "browser_scroll", ref, element: "área rolável", needLocator: Boolean(ref) });
      if (g.blocked) return g.blocked;

      const px = typeof amount === "number" ? amount : amount === "half" ? Math.round(config.viewport.height / 2) : config.viewport.height - 100;

      const result = g.locator
        ? await g.locator.evaluate((el, { direction: d, px: p }) => {
            if (d === "top") el.scrollTop = 0;
            else if (d === "bottom") el.scrollTop = el.scrollHeight;
            else el.scrollTop += d === "down" ? p : -p;
            return { scrollY: el.scrollTop, atBottom: el.scrollTop + el.clientHeight >= el.scrollHeight - 2 };
          }, { direction, px })
        : await g.page.evaluate(({ direction: d, px: p }) => {
            if (d === "top") window.scrollTo(0, 0);
            else if (d === "bottom") window.scrollTo(0, document.body.scrollHeight);
            else window.scrollBy(0, d === "down" ? p : -p);
            return { scrollY: window.scrollY, atBottom: window.scrollY + window.innerHeight >= document.body.scrollHeight - 2 };
          }, { direction, px });

      return ok({ ...result, url: g.page.url() });
    }),
  );

  server.registerTool(
    "browser_wait_for",
    {
      title: "Esperar condição",
      description:
        "Espera até que algo aconteça: um texto aparecer/sumir, um seletor existir, a URL conter algo, a rede ficar ociosa, ou um tempo passar. Pelo menos uma condição é obrigatória. Use antes de agir em telas que carregam de forma assíncrona (Azure Portal é SPA).",
      inputSchema: {
        text: z.string().optional().describe("esperar este texto aparecer"),
        textGone: z.string().optional().describe("esperar este texto sumir"),
        selector: z.string().optional(),
        urlContains: z.string().optional(),
        networkIdle: z.boolean().optional(),
        timeMs: z.number().int().positive().max(30000).optional(),
        timeoutMs: z.number().int().positive().max(120000).optional(),
        snapshot: z.enum(["auto", "none"]).optional(),
      },
    },
    handler("browser_wait_for", async ({ text, textGone, selector, urlContains, networkIdle, timeMs, timeoutMs = 30000, snapshot: snapWanted = "auto" }) => {
      const page = await getPage();
      if (!text && !textGone && !selector && !urlContains && !networkIdle && !timeMs) {
        return fail({ code: "NO_CONDITION", message: "informe pelo menos uma condição (text, textGone, selector, urlContains, networkIdle ou timeMs)" });
      }
      const started = Date.now();
      let matched = "time";

      if (timeMs) await page.waitForTimeout(timeMs);
      if (text) {
        await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout: timeoutMs });
        matched = "text";
      }
      if (textGone) {
        await page.getByText(textGone, { exact: false }).first().waitFor({ state: "hidden", timeout: timeoutMs });
        matched = "textGone";
      }
      if (selector) {
        await page.locator(selector).first().waitFor({ state: "visible", timeout: timeoutMs });
        matched = "selector";
      }
      if (urlContains) {
        await page.waitForURL((u) => String(u).includes(urlContains), { timeout: timeoutMs });
        matched = "url";
      }
      if (networkIdle) {
        await page.waitForLoadState("networkidle", { timeout: timeoutMs });
        matched = "networkidle";
      }

      return ok(await after(page, snapWanted, { matched, elapsedMs: Date.now() - started }));
    }),
  );
}

export { clampWait };
