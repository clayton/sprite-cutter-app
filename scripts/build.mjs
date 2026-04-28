import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

function gitValue(command, fallback) {
  try {
    return execSync(command, { encoding: "utf8" }).trim() || fallback;
  } catch {
    return fallback;
  }
}

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });

for (const file of ["index.html", "style.css", "app.js", "sample-wizard-sheet.png"]) {
  if (existsSync(file)) {
    cpSync(file, `dist/${file}`);
  }
}

const version = gitValue("git rev-list --count HEAD", "dev");
const commit = gitValue("git rev-parse --short HEAD", "local");
const builtAt = new Date().toISOString();

writeFileSync(
  "dist/build-meta.js",
  `window.BUILD_INFO = ${JSON.stringify({ version, commit, builtAt }, null, 2)};\n`
);
