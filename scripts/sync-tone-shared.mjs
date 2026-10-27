// Copies the shared contracts of the tone extension repository (packages/shared/src)
// into src/tone/shared, so the web validates the same events, components and rules
// as the server and the extension. Run it after the contracts change there:
//
//   node scripts/sync-tone-shared.mjs ../extension
//
// The copies are generated: edit them in toneorg/extension, never here.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const source = resolve(process.argv[2] ?? "../extension");
const from = join(source, "packages/shared/src");
const to = resolve("src/tone/shared");
const commit = execFileSync("git", ["-C", source, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
// Logging helpers are the extension's own; the web does not need them.
const skip = new Set(["telemetry.ts"]);

rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });
const files = readdirSync(from).filter((name) => name.endsWith(".ts") && !skip.has(name));
for (const name of files) {
  const body = readFileSync(join(from, name), "utf8");
  const header = `// Gerado de toneorg/extension@${commit.slice(0, 12)} (packages/shared/src/${name}). Não edite aqui.\n`;
  writeFileSync(join(to, name), header + body);
}
writeFileSync(join(to, "SOURCE"), `toneorg/extension@${commit}\n${files.join("\n")}\n`);
console.log(`${files.length} arquivos de toneorg/extension@${commit.slice(0, 12)} em src/tone/shared`);
