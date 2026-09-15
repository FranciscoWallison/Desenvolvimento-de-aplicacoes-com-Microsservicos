import { z } from "zod";
import { clampWait, config } from "../config.js";
import { closeBrowser, getPage, isRunning } from "../browser.js";
import * as confirm from "../confirm.js";
import { clearOverlay, readDecision, showOverlay } from "../overlay.js";
import { isHumanOnlyZone } from "../risk.js";
import { handler, ok } from "./_shared.js";

/**
 * Nenhuma destas tools bloqueia indefinidamente. O cliente MCP tem timeout de
 * tool call, e o usuário pode levar 10 minutos no MFA. Então esperamos no
 * máximo `maxWaitSec` (teto duro em config), devolvemos {status:"waiting"} e o
 * assistente simplesmente chama de novo.
 */
async function poll({ maxWaitSec, pollMs, check }) {
  const limit = clampWait(maxWaitSec) * 1000;
  const started = Date.now();
  for (;;) {
    const res = await check();
    if (res) return { done: res, elapsedSec: Math.round((Date.now() - started) / 1000) };
    if (Date.now() - started >= limit) return { done: null, elapsedSec: Math.round((Date.now() - started) / 1000) };
    await new Promise((r) => setTimeout(r, pollMs));
  }
}

const SITE_RULES = {
  lms: { url: "https://labs.azureacademy.com.br/matricula/login", done: (u) => u.includes("labs.azureacademy.com.br") && !/\/(matricula\/)?login/.test(u) },
  azure: { url: "https://portal.azure.com", done: (u) => u.includes("portal.azure.com") && !u.includes("login.microsoftonline.com") },
  devops: { url: "https://dev.azure.com", done: (u) => u.includes("dev.azure.com") && !u.includes("login.microsoftonline.com") },
};

export function register(server) {
  server.registerTool(
    "wait_for_login",
    {
      title: "Aguardar login do usuário",
      description:
        "Abre a tela de login (se preciso) e aguarda o usuário concluir usuário/senha/MFA. Retorna status 'waiting' após no máximo ~60s — chame de novo para continuar aguardando. O assistente nunca digita credenciais.",
      inputSchema: {
        site: z.enum(["lms", "azure", "devops", "custom"]),
        url: z.string().optional().describe("obrigatório quando site=custom"),
        successUrlPattern: z.string().optional().describe("trecho que a URL deve conter para considerar logado"),
        successText: z.string().optional().describe("texto que deve aparecer na página quando logado"),
        navigate: z.boolean().optional().describe("navegar para a tela de login se ainda não estiver nela (padrão: true)"),
        maxWaitSec: z.number().int().positive().optional(),
        pollMs: z.number().int().min(500).max(10000).optional(),
      },
    },
    handler("wait_for_login", async ({ site, url, successUrlPattern, successText, navigate = true, maxWaitSec = 45, pollMs = 1500 }) => {
      const page = await getPage();
      const rule = SITE_RULES[site];
      const target = url || rule?.url;

      const isDone = async () => {
        const u = page.url();
        if (successUrlPattern) return u.includes(successUrlPattern);
        if (successText) return (await page.getByText(successText, { exact: false }).count().catch(() => 0)) > 0;
        if (rule) return rule.done(u);
        return !isHumanOnlyZone(u) && !u.includes("about:blank");
      };

      if (await isDone()) {
        return ok({ status: "done", url: page.url(), title: await page.title().catch(() => ""), elapsedSec: 0 });
      }

      if (navigate && target && !page.url().includes(new URL(target).host)) {
        await page.goto(target, { waitUntil: "domcontentloaded" }).catch(() => {});
      }

      const { done, elapsedSec } = await poll({ maxWaitSec, pollMs, check: async () => ((await isDone()) ? true : null) });

      if (done) return ok({ status: "done", url: page.url(), title: await page.title().catch(() => ""), elapsedSec });
      return ok({
        status: "waiting",
        url: page.url(),
        elapsedSec,
        hint: "O usuário ainda não concluiu o login. Peça a ele para completar na janela do Chrome (e marcar 'Continuar conectado' para a sessão persistir), e chame wait_for_login de novo.",
      });
    }),
  );

  server.registerTool(
    "pause_for_human",
    {
      title: "Pedir uma ação ao usuário",
      description:
        "Mostra um banner na própria página pedindo que o usuário faça algo (resolver um captcha, escolher uma assinatura, revisar uma tela) e aguarda ele aprovar ou recusar. Retorna 'waiting' após ~60s — chame de novo.",
      inputSchema: {
        message: z.string().describe("o que você precisa que o usuário faça"),
        detail: z.string().optional(),
        maxWaitSec: z.number().int().positive().optional(),
        buttons: z.array(z.string()).length(2).optional(),
      },
    },
    handler("pause_for_human", async ({ message, detail, maxWaitSec = 45, buttons = ["Pronto, continuar", "Cancelar"] }) => {
      const page = await getPage();
      const shown = await showOverlay(page, { title: "Ação necessária", action: message, reason: detail, buttons });
      if (!shown) {
        return ok({ status: "waiting", hint: "Não foi possível mostrar o banner nesta página. Peça a ação ao usuário pelo chat e chame de novo quando ele confirmar." });
      }
      const { done, elapsedSec } = await poll({
        maxWaitSec,
        pollMs: 800,
        check: async () => {
          const d = await readDecision(page);
          if (d === "approved" || d === "rejected") return d;
          if (d === null) await showOverlay(page, { title: "Ação necessária", action: message, reason: detail, buttons }); // navegou: reinjeta
          return null;
        },
      });
      if (done) return ok({ status: done, elapsedSec, url: page.url() });
      return ok({ status: "waiting", elapsedSec, hint: "O banner continua na tela. Chame pause_for_human de novo para seguir aguardando." });
    }),
  );

  server.registerTool(
    "confirm_action",
    {
      title: "Confirmar ação sensível",
      description:
        "Pede ao usuário, num banner na própria página, aprovação para a ação sensível que gerou o token. Aprovado, repita a tool original passando confirmToken. O token é de uso único, expira e é invalidado se a página mudar.",
      inputSchema: {
        token: z.string(),
        via: z.enum(["browser", "file"]).optional(),
        maxWaitSec: z.number().int().positive().optional(),
      },
    },
    handler("confirm_action", async ({ token, via = config.confirmChannel, maxWaitSec = 45 }) => {
      const rec = confirm.get(token);
      if (!rec) return ok({ status: "expired", hint: "Token inexistente ou expirado. Repita a tool original para gerar um novo." });
      if (rec.approved) return ok({ status: "approved", action: rec.action, hint: "Repita a tool original passando confirmToken." });

      const page = await getPage();

      if (via === "file") {
        confirm.clearFileDecision();
        const p = confirm.fileChannelPath();
        const { done, elapsedSec } = await poll({ maxWaitSec, pollMs: 1000, check: async () => confirm.readFileDecision() });
        if (done === "approved") {
          confirm.approve(token);
          confirm.clearFileDecision();
          return ok({ status: "approved", action: rec.action, elapsedSec });
        }
        if (done === "rejected") {
          confirm.reject(token);
          confirm.clearFileDecision();
          return ok({ status: "rejected", elapsedSec });
        }
        return ok({ status: "waiting", elapsedSec, hint: `Escreva "approve" ou "reject" em ${p} e chame de novo.` });
      }

      const shown = await showOverlay(page, { title: "⚠ Ação sensível — precisa da sua aprovação", action: rec.action, reason: rec.reason });
      if (!shown) {
        return ok({ status: "waiting", hint: `Não deu para mostrar o banner nesta página. Use via:"file" e escreva "approve" em ${confirm.fileChannelPath()}.` });
      }

      const { done, elapsedSec } = await poll({
        maxWaitSec,
        pollMs: 800,
        check: async () => {
          const d = await readDecision(page);
          if (d === "approved" || d === "rejected") return d;
          if (d === null) await showOverlay(page, { title: "⚠ Ação sensível — precisa da sua aprovação", action: rec.action, reason: rec.reason });
          return null;
        },
      });

      if (done === "approved") {
        confirm.approve(token);
        await clearOverlay(page);
        return ok({ status: "approved", action: rec.action, elapsedSec, hint: "Repita a tool original passando confirmToken." });
      }
      if (done === "rejected") {
        confirm.reject(token);
        await clearOverlay(page);
        return ok({ status: "rejected", elapsedSec, hint: "O usuário recusou. Não tente de novo sem uma nova instrução dele." });
      }
      return ok({ status: "waiting", elapsedSec, expiresInSec: Math.max(0, Math.round((rec.expiresAt - Date.now()) / 1000)), hint: "Banner na tela aguardando. Chame confirm_action de novo." });
    }),
  );

  server.registerTool(
    "browser_close",
    {
      title: "Fechar navegador",
      description: "Fecha a janela do Chrome e libera o lock do perfil. A sessão de login permanece salva no perfil.",
      inputSchema: {},
    },
    handler("browser_close", async () => {
      const was = isRunning();
      await closeBrowser();
      return ok({ ok: true, wasRunning: was, note: "Perfil preservado — o login continua válido na próxima abertura." });
    }),
  );
}
