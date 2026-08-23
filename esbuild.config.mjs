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
  const width = 76;
  const title = `📦 MÓDULO: ${modulePath}`;
  const padding = Math.max(0, width - title.length - 4);
  const topBorder = "═".repeat(width);
  const bottomBorder = "═".repeat(width);
  return `\n/* ╔${topBorder}╗\n * ║  ${title}${" ".repeat(padding)}║\n * ╚${bottomBorder}╝ */\n`;
}

// Post-process the generated bundle to inject aesthetic ASCII module separators
function injectAsciiSeparators(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, "utf8");

  // Replace "// src/path/file.js" with aesthetic ASCII box
  code = code.replace(/(?:^|\n)\/\/\s+(src\/[^\n\r]+)/g, (match, p1) => {
    return "\n" + formatAsciiBanner(p1);
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
  if (fs.existsSync("styles.css")) {
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

            // 2. Copy static assets to dist/
            copyStaticAssets();

            // 3. Maintain synchronized root main.js for local Obsidian live dev
            if (fs.existsSync("dist/main.js")) {
              fs.copyFileSync("dist/main.js", "main.js");
            }

            // 4. Auto-sync to active vault if present
            const vaultPluginDir = "D:/PKM/.obsidian/plugins/tabs-extended";
            if (fs.existsSync(vaultPluginDir) && path.resolve(vaultPluginDir) !== path.resolve(".")) {
              fs.copyFileSync("dist/main.js", path.join(vaultPluginDir, "main.js"));
              fs.copyFileSync("manifest.json", path.join(vaultPluginDir, "manifest.json"));
              if (fs.existsSync("styles.css")) {
                fs.copyFileSync("styles.css", path.join(vaultPluginDir, "styles.css"));
              }
              console.log("🚀 Sincronizado automáticamente con la bóveda de Obsidian en D:/PKM!");
            }
            console.log("✨ Build completado con éxito: Separadores ASCII generados -> dist/ y root actualizados.");
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
