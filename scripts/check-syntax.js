#!/usr/bin/env node
// Extrait les <script> inline (sans src) d'un fichier HTML et vérifie leur
// syntaxe avec `node --check`, sans les exécuter.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: node scripts/check-syntax.js <file.html> [...]");
  process.exit(1);
}

let failed = false;
for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (!scripts.length) {
    console.log(`SKIP ${file} (aucun <script> inline)`);
    continue;
  }
  const tmp = path.join(os.tmpdir(), `syntax-check-${Date.now()}-${Math.random().toString(36).slice(2)}.js`);
  fs.writeFileSync(tmp, scripts.join("\n"));
  try {
    execFileSync(process.execPath, ["--check", tmp], { stdio: "inherit" });
    console.log(`OK   ${file}`);
  } catch {
    failed = true;
    console.error(`FAIL ${file}`);
  } finally {
    fs.unlinkSync(tmp);
  }
}
process.exit(failed ? 1 : 0);
