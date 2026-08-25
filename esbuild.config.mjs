import esbuild from "esbuild";
import process from "process";
import fs from "fs";
import path from "path";

const banner = `/*
 * ═══════════════════════════════════════════════════════════════════════════════
 *  TABS EXTENDED - PLUGIN BUNDLE
 *  Generado automáticamente por esbuild
 *  Repositorio: https://github.com/Baalgarthem/obsidian-tabs-extended
 * ═══════════════════════════════════════════════════════════════════════════════
 */
`;

const isProd = process.argv[2] === "production";

// Format aesthetic ASCII section banners for each bundled module
function formatAsciiBanner(modulePath) {
  const width = 80;
  const title = `📦 MÓDULO: ${modulePath}`;
  const padding = Math.max(0, width - title.length - 4);
  const border = "═".repeat(width);
  return `\n/* ╔${border}╗\n * ║  ${title}${" ".repeat(padding)}║\n * ╚${border}╝ */\n`;
}

// Post-process the generated bundle to inject aesthetic ASCII module separators
function injectAsciiSeparators(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, "utf8");

  // Replace "// src/..." with aesthetic ASCII box
  code = code.replace(/(?:^|\n)\/\/\s+((?:src\/|[a-zA-Z0-9_\-\.\/]+\.js)[^\n\r]*)/g, (match, p1) => {
    if (p1.startsWith("src/") || p1.includes("i18n") || p1.includes("core") || p1.includes("editor") || p1.includes("components") || p1.includes("modals") || p1.includes("settings") || p1.includes("styles")) {
      return "\n" + formatAsciiBanner(p1);
    }
    return match;
  });

  fs.writeFileSync(filePath, code, "utf8");
}

// Copy static assets to dist/
function copyStaticAssets() {
  if (!fs.existsSync("dist")) {
    fs.mkdirSync("dist", { recursive: true });
  }
  if (fs.existsSync("manifest.json")) {
    fs.copyFileSync("manifest.json", "dist/manifest.json");
  }
  if (fs.existsSync("src/styles.css")) {
    fs.copyFileSync("src/styles.css", "dist/styles.css");
  } else if (fs.existsSync("styles.css")) {
    fs.copyFileSync("styles.css", "dist/styles.css");
  }
}

const context = await esbuild.context({
  banner: {
    js: banner,
  },
  entryPoints: ["src/main.js"],
  bundle: true,
  external: [
    "obsidian",
    "electron"
  ],
  format: "cjs",
  target: "es2022",
  logLevel: "info",
  sourcemap: isProd ? false : "inline",
  treeShaking: true,
  outfile: "dist/main.js",
  minify: false,
  plugins: [
    {
      name: "ascii-separator-and-assets-plugin",
      setup(build) {
        build.onEnd((result) => {
          if (result.errors.length === 0) {
            // 1. Inject aesthetic ASCII banners into dist/main.js
            injectAsciiSeparators("dist/main.js");

            // 2. Ensure all 3 required files exist in dist/ (main.js, manifest.json, styles.css)
            copyStaticAssets();

            // 3. Auto-sync to active Obsidian vault if present
            const vaultPluginDir = "D:/PKM/.obsidian/plugins/tabs-extended";
            if (fs.existsSync(vaultPluginDir) && path.resolve(vaultPluginDir) !== path.resolve(".")) {
              fs.copyFileSync("dist/main.js", path.join(vaultPluginDir, "main.js"));
              fs.copyFileSync("dist/manifest.json", path.join(vaultPluginDir, "manifest.json"));
              if (fs.existsSync("dist/styles.css")) {
                fs.copyFileSync("dist/styles.css", path.join(vaultPluginDir, "styles.css"));
              }
              console.log("🚀 Sincronizado automáticamente con la bóveda de Obsidian en D:/PKM!");
            }
            console.log("✨ Build completado con éxito: main.js, manifest.json y styles.css generados en dist/.");
          }
        });
      }
    }
  ]
});

if (isProd) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
  console.log("Watching for changes in src/...");
}
