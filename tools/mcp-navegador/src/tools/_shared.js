/**
 * _shared.js — plumbing comum das tools: formatação de resposta e o portão de
 * segurança que TODA ação mutadora tem de atravessar.
 */

import { getPage, setActivePage } from "../browser.js";
import { autoSnapshot, locatorFor, snapshot, StaleRefError } from "../refs.js";
import * as confirm from "../confirm.js";
import { classify } from "../risk.js";
import { log } from "../log.js";

/** Toda resposta é texto JSON — barato de ler para o modelo e estável de parsear. */
export const ok = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });

export const fail = (obj) => ({ content: [{ type: "text", text: JSON.stringify({ error: true, ...obj }, null, 2) }], isError: true });

/** Envelope padrão: erros viram resposta estruturada, nunca stack trace cru. */
export function handler(name, fn) {
  return async (args) => {
    try {
      return await fn(args || {});
    } catch (err) {
      if (err instanceof StaleRefError) {
        return fail({ code: "STALE_REF", ref: err.ref, message: err.message, hint: "chame browser_snapshot de novo e use o ref atualizado" });
      }
      log.error(`[${name}] falhou:`, err);
      return fail({ code: "TOOL_ERROR", tool: name, message: String(err?.message || err) });
    }
  };
}

/**
 * Portão de segurança. Retorna `{ blocked: <resposta> }` quando a ação não pode
 * seguir, ou `{ page, locator }` quando está liberada.
 *
 * O fluxo do CONFIRM é de propósito em duas viagens:
 *   1ª chamada  → servidor devolve token, NÃO age
 *   confirm_action → usuário aprova no overlay
 *   2ª chamada com confirmToken → servidor age
 */
export async function guard({ tool, ref, element, confirmToken, needLocator = true }) {
  const page = await getPage();
  setActivePage(page);

  const verdict = await classify({ page, tool, ref, element });

  if (verdict.risk === "deny") {
    return {
      blocked: fail({
        code: "HUMAN_ONLY_ZONE",
        risk: "deny",
        url: page.url(),
        action: verdict.action,
        hint: verdict.hint,
      }),
    };
  }

  if (verdict.risk === "confirm") {
    const snap = await snapshot(page, { maxChars: 20000 }).catch(() => ({ snapshot: "" }));

    if (confirmToken) {
      const res = confirm.consume(confirmToken, { tool, ref, url: page.url(), snapshot: snap.snapshot });
      if (!res.ok) {
        return { blocked: fail({ code: "CONFIRM_INVALID", message: res.reason, hint: "peça uma nova confirmação ao usuário" }) };
      }
      log.info(`[guard] ação aprovada e liberada: ${verdict.action}`);
    } else {
      const { token, ttlSec } = confirm.mint({
        tool,
        ref,
        url: page.url(),
        snapshot: snap.snapshot,
        action: verdict.action,
        reason: verdict.reason,
      });
      return {
        blocked: ok({
          blocked: true,
          risk: "confirm",
          reason: verdict.reason,
          action: verdict.action,
          token,
          ttlSec,
          hint: `Ação sensível: NÃO foi executada. Chame confirm_action({token:"${token}"}) — o usuário aprova no banner que aparece no navegador — e depois repita esta tool passando confirmToken.`,
        }),
      };
    }
  }

  const locator = needLocator && ref ? await locatorFor(page, ref, element) : null;
  return { page, locator };
}

/** Snapshot pós-ação, respeitando o parâmetro `snapshot`. */
export async function after(page, wanted, extra = {}) {
  const s = await autoSnapshot(page, wanted);
  return { ok: true, url: page.url(), ...extra, ...(s ? { snapshot: s } : {}) };
}
