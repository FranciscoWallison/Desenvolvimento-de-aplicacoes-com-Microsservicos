#!/usr/bin/env node
/**
 * mcp-navegador — servidor MCP que dirige um Chrome real com perfil persistente.
 *
 * ⚠️ A ORDEM DOS IMPORTS IMPORTA.
 * `./log.js` vem primeiro porque, no import, ele redireciona `console.*` e
 * protege `process.stdout` — que no transporte stdio carrega EXCLUSIVAMENTE
 * JSON-RPC. Um único `console.log` de qualquer dependência corromperia o
 * protocolo e o cliente desconectaria sem mensagem de erro.
 *
 * ⚠️ ZERO I/O AQUI.
 * Nada de abrir navegador, ler policy, tocar disco ou rede no boot. O `initialize`
 * do MCP precisa responder em milissegundos: o cliente tem 30 s para conectar, e
 * foi exatamente esse orçamento que o servidor `playwright` desta máquina
 * estourava. O Chrome sobe preguiçosamente, na primeira tool que precisar dele.
 */

import "./log.js";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAll } from "./tools/index.js";
import { log } from "./log.js";

const server = new McpServer(
  { name: "navegador", version: "1.0.0" },
  {
    instructions: [
      "Navegador Chrome real, com perfil persistente, para navegar cursos e portais e documentar o que se vê.",
      "",
      "Fluxo típico:",
      "  1. browser_navigate → a URL desejada",
      "  2. wait_for_login   → o USUÁRIO faz login/MFA (chame em loop enquanto vier status 'waiting')",
      "  3. browser_snapshot → pega os refs dos elementos",
      "  4. browser_click / browser_type usando esses refs",
      "  5. browser_screenshot → grava a evidência direto na pasta de documentação",
      "  6. browser_extract   → transforma a página em Markdown",
      "",
      "Regras que o servidor aplica sozinho:",
      "  • Telas de login, MFA e pagamento são zona exclusiva do usuário — toda ação é bloqueada nelas.",
      "  • Campos de senha e OTP nunca são preenchidos, em nenhuma URL.",
      "  • Ações sensíveis (cobrança, compra, exclusão) devolvem um token em vez de executar:",
      "    chame confirm_action com ele, o usuário aprova num banner no navegador, e só então",
      "    repita a tool original passando confirmToken.",
      "  • Refs vêm sempre do browser_snapshot mais recente; se der STALE_REF, tire outro snapshot.",
    ].join("\n"),
  },
);

registerAll(server);

const transport = new StdioServerTransport();
await server.connect(transport);
log.info("[navegador] servidor MCP pronto (navegador ainda não aberto — sobe na primeira tool)");

// Fim do stdin = cliente encerrou. No Windows este é o sinal confiável;
// SIGTERM não existe de verdade. O handler de exit em browser.js fecha o Chrome.
process.stdin.on("end", () => process.exit(0));
