/**
 * evidence.js — nomeação e gravação das capturas de tela.
 *
 * Nome: {licao}_{NN}_{slug}.png
 * O NN vem de um `readdir` da pasta, não de contador em memória — assim a
 * sequência continua correta depois de reiniciar o servidor MCP, e nunca abre
 * buracos nem sobrescreve arquivo existente.
 */

import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";

/** kebab-case ASCII: tira acento via NFD para o nome do arquivo nunca depender
 *  de codificação — o repo já tem uma pasta acentuada e isso dá dor de cabeça. */
export function slugify(input, maxLen = 40) {
  return (
    String(input || "captura")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, maxLen)
      .replace(/-+$/g, "") || "captura"
  );
}

/** Resolve a pasta de imagens e impede escrita fora da raiz de documentação. */
export function resolveImgDir(docsDir) {
  const dir = docsDir || config.defaultDocsDir;
  const abs = path.resolve(config.docsRoot, dir, config.imgSubdir);
  const root = path.resolve(config.docsRoot);
  if (!abs.startsWith(root)) {
    throw new Error(`docsDir aponta para fora de MCP_NAV_DOCS_ROOT (${root})`);
  }
  return abs;
}

/** Próximo sequencial da lição, lendo o que já existe no disco. */
export function nextSeq(imgDir, lesson) {
  let max = 0;
  try {
    const re = new RegExp(`^${lesson.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}_(\\d{2})_`);
    for (const f of fs.readdirSync(imgDir)) {
      const m = re.exec(f);
      if (m) max = Math.max(max, Number(m[1]));
    }
  } catch {
    /* pasta ainda não existe → começa em 1 */
  }
  return max + 1;
}

/**
 * Grava o buffer e devolve tudo que é preciso para colar no Markdown.
 * `relativePath` é relativo AO DIRETÓRIO DO .md — é o que faz o link funcionar
 * igual no VS Code e no GitHub (e é imune ao bug de case que quebrou as
 * imagens antigas de Devops/Jenkins).
 */
export function saveShot(buffer, { lesson, slug, seq, docsDir, alt }) {
  const imgDir = resolveImgDir(docsDir);
  fs.mkdirSync(imgDir, { recursive: true });

  const safeLesson = slugify(lesson, 60);
  const safeSlug = slugify(slug);
  const n = Number.isFinite(seq) && seq > 0 ? seq : nextSeq(imgDir, safeLesson);
  const filename = `${safeLesson}_${String(n).padStart(2, "0")}_${safeSlug}.png`;
  const absPath = path.join(imgDir, filename);

  fs.writeFileSync(absPath, buffer);

  const relativePath = `${config.imgSubdir}/${filename}`;
  const altText = alt || slug.replace(/-/g, " ");
  return {
    absPath: absPath.replace(/\\/g, "/"),
    relativePath,
    markdown: `![${altText}](${relativePath})`,
    htmlSnippet: `<img src="${relativePath}" width="900" alt="${altText}" />`,
    seq: n,
    bytes: buffer.length,
  };
}

/** Grava um .md extraído de página, dentro da raiz de documentação. */
export function saveDoc(relPath, content) {
  const abs = path.resolve(config.docsRoot, relPath);
  const root = path.resolve(config.docsRoot);
  if (!abs.startsWith(root)) throw new Error(`saveTo aponta para fora de MCP_NAV_DOCS_ROOT (${root})`);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf8");
  return abs.replace(/\\/g, "/");
}
