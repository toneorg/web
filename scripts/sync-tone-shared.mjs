// Copies the shared contracts of the tone server repository (packages/shared/src)
// into src/tone/shared, so the web validates the same events, components and rules
// as the server, and the component drawings (packages/genui-react/src) into
// src/tone/genui. Run it after either changes there:
//
//   npm run sync:shared -- <path to the server repository>
//
// The copies are generated: edit them in the server repository, never here.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const source = resolve(process.argv[2] ?? "../tone-extension");
const commit = execFileSync("git", ["-C", source, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
// Logging helpers are the server's own; the web does not need them.
const skip = new Set(["telemetry.ts"]);

/** Copies one package's src; `rewrite` turns its workspace imports into the web's paths. */
function copy(pkg, dest, suffixes, rewrite = (body) => body) {
  const dir = join(source, "packages", pkg, "src");
  const out = resolve(dest);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const files = readdirSync(dir).filter((name) => suffixes.some((suffix) => name.endsWith(suffix)) && !skip.has(name));
  for (const name of files) {
    const body = rewrite(readFileSync(join(dir, name), "utf8"));
    const where = `toneorg/extension@${commit.slice(0, 12)} (packages/${pkg}/src/${name})`;
    const header = name.endsWith(".css") ? `/* Gerado de ${where}. Não edite aqui. */\n` : `// Gerado de ${where}. Não edite aqui.\n`;
    writeFileSync(join(out, name), header + body);
  }
  writeFileSync(join(out, "SOURCE"), `toneorg/extension@${commit}\n${files.join("\n")}\n`);
  console.log(`${files.length} arquivos de toneorg/extension@${commit.slice(0, 12)} em ${dest}`);
}

copy("shared", "src/tone/shared", [".ts"]);
copy("genui-react", "src/tone/genui", [".ts", ".tsx", ".css"], (body) =>
  body.replaceAll('from "@tone/shared/genui"', 'from "@/tone/shared/genui"').replaceAll('from "@tone/shared"', 'from "@/tone/shared"'),
);
