import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import { getContext } from "../browser.js";
import { fail, handler, ok } from "./_shared.js";

/**
 * browser_download — baixa um arquivo usando a SESSÃO VIVA do navegador.
 *
 * Por que existe: material de curso costuma ficar atrás de um endpoint
 * autenticado (ex.: `leitorPdf.asp?token=…`), que só responde com o arquivo
 * para quem tem o cookie da sessão. `ctx.request` compartilha os cookies do
 * contexto, então o download acontece como se fosse o próprio navegador —
 * sem nunca exportar cookie nem credencial para fora do servidor.
 *
 * ⚠️ Cookies de sessão (ASP e afins) NÃO sobrevivem a `browser_close`.
 * Baixe enquanto a janela ainda está aberta.
 */

/** Impede escrita fora da raiz de documentação. */
function resolverDestino(saveTo) {
  const abs = path.resolve(config.docsRoot, saveTo);
  const raiz = path.resolve(config.docsRoot);
  if (!abs.startsWith(raiz)) throw new Error(`saveTo aponta para fora de MCP_NAV_DOCS_ROOT (${raiz})`);
  return abs;
}

const ASSINATURAS = {
  pdf: "%PDF-",
  zip: "PK\u0003\u0004",
};

export function register(server) {
  server.registerTool(
    "browser_download",
    {
      title: "Baixar arquivo (com a sessão do navegador)",
      description:
        "Baixa um arquivo de uma URL usando a sessão autenticada do navegador e grava dentro da raiz de documentação. Serve para material de curso protegido por login. Verifica a assinatura do arquivo e recusa quando o servidor devolve HTML (sinal de sessão expirada) em vez do arquivo esperado.",
      inputSchema: {
        url: z.string().describe("URL completa do arquivo"),
        saveTo: z.string().describe("caminho de destino relativo a MCP_NAV_DOCS_ROOT, ex.: Devops/Cloud/Azure-Academy/materiais/01-lab.pdf"),
        expect: z.enum(["pdf", "zip", "any"]).optional().describe("tipo esperado; 'pdf'/'zip' validam a assinatura do arquivo (padrão: any)"),
        referer: z.string().optional().describe("header Referer, para endpoints que exigem origem"),
        timeoutMs: z.number().int().positive().max(300000).optional(),
      },
    },
    handler("browser_download", async ({ url, saveTo, expect = "any", referer, timeoutMs = 120000 }) => {
      const ctx = await getContext();
      const destino = resolverDestino(saveTo);

      const headers = { accept: "*/*" };
      if (referer) headers.referer = referer;

      const resp = await ctx.request.get(url, { headers, timeout: timeoutMs });
      const buf = await resp.body();
      const contentType = resp.headers()["content-type"] || "";

      const assinaturaEsperada = ASSINATURAS[expect];
      const inicio = buf.subarray(0, 8).toString("latin1");
      if (assinaturaEsperada && !inicio.startsWith(assinaturaEsperada)) {
        const pareceHtml = /^\s*<(!doctype|html)/i.test(inicio);
        return fail({
          code: pareceHtml ? "SESSAO_EXPIRADA" : "TIPO_INESPERADO",
          status: resp.status(),
          contentType,
          bytes: buf.length,
          inicio: JSON.stringify(inicio),
          message: pareceHtml
            ? "O servidor devolveu HTML em vez do arquivo — quase sempre é sessão expirada."
            : `O arquivo não começa com a assinatura de ${expect}.`,
          hint: pareceHtml
            ? "Peça ao usuário para refazer o login (wait_for_login) SEM fechar o navegador, e tente de novo. Cookies de sessão não sobrevivem a browser_close."
            : "Confira a URL ou use expect:'any'.",
        });
      }

      fs.mkdirSync(path.dirname(destino), { recursive: true });
      fs.writeFileSync(destino, buf);

      return ok({
        savedPath: destino.split(path.sep).join("/"),
        relativePath: saveTo,
        bytes: buf.length,
        megabytes: Number((buf.length / 1024 / 1024).toFixed(2)),
        status: resp.status(),
        contentType,
      });
    }),
  );
}
