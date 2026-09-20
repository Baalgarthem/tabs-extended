#!/usr/bin/env node
/**
 * deployment-manager.js
 * Interactive deployment script for tabs-extended plugin.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let inquirer;
try {
  inquirer = require('inquirer');
  if (inquirer && inquirer.default) inquirer = inquirer.default;
} catch (e) {
  try {
    inquirer = require(path.resolve(__dirname, '../tabs-extended/node_modules/inquirer'));
    if (inquirer && inquirer.default) inquirer = inquirer.default;
  } catch (e2) {
    try {
      inquirer = require(path.resolve(__dirname, '../ascii-tree-generator-extended/node_modules/inquirer'));
      if (inquirer && inquirer.default) inquirer = inquirer.default;
    } catch (e3) {
      console.error('Inquirer no está disponible. Ejecuta \x1b[33mnpm install inquirer\x1b[0m.');
      process.exit(1);
    }
  }
}

// ---------- Configuration ----------
const PLUGIN_NAME = 'tabs-extended';
const TARGET_DIR = 'D:/Personal Atlas/.obsidian/plugins/tabs-extended';
const DIST_DIR = path.resolve(__dirname, 'dist');
const GENERIC_COMMIT_MSG = 'chore: deployment commit – build/inject updates';
// -----------------------------------

function runCommand(command) {
  console.log(`\x1b[34m> ${command}\x1b[0m`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (err) {
    console.error(`\x1b[31mCommand failed: ${command}\x1b[0m`);
    process.exit(1);
  }
}

function clearScreen() {
  process.stdout.write('\x1Bc');
}

function getPluginVersion() {
  try {
    if (fs.existsSync(path.resolve(__dirname, 'package.json'))) {
      const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));
      if (pkg.version) return pkg.version;
    }
    if (fs.existsSync(path.resolve(__dirname, 'manifest.json'))) {
      const m = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'manifest.json'), 'utf-8'));
      if (m.version) return m.version;
    }
    if (fs.existsSync(path.resolve(__dirname, 'src/manifest.json'))) {
      const m = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'src/manifest.json'), 'utf-8'));
      if (m.version) return m.version;
    }
    return 'N/A';
  } catch (e) {
    return 'N/A';
  }
}

function getDistVersion() {
  const manifestPath = path.join(DIST_DIR, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      return manifest.version || 'N/A';
    } catch (e) {}
  }
  return null;
}

function renderMenuBox() {
  const pkgVersion = getPluginVersion();
  const distVersion = getDistVersion();

  let commit = 'N/A', commitMsg = '';
  try {
    commit = execSync('git rev-parse --short HEAD').toString().trim();
    commitMsg = execSync('git log -1 --pretty=%s').toString().trim();
  } catch (e) {}

  const title = `=== MENÚ DE OPCIONES [${PLUGIN_NAME}] ===`;
  const vLine = `  Versión actual del plugin : ${pkgVersion}`;
  const lines = [vLine];

  if (distVersion !== null) {
    lines.push(`  Versión manifest (dist)   : ${distVersion}`);
    if (distVersion !== 'N/A' && pkgVersion !== distVersion) {
      lines.push('  (!) Advertencia: Versión dist difiere de package.json');
    }
  }

  lines.push(`  Último commit             : ${commit} – ${commitMsg}`);

  const width = Math.max(title.length + 8, ...lines.map((l) => l.length + 4));

  const padCenter = (t) => {
    const diff = width - t.length;
    const left = Math.floor(diff / 2);
    return ' '.repeat(left) + t + ' '.repeat(diff - left);
  };

  console.log('\n╔' + '═'.repeat(width) + '╗');
  console.log('║' + padCenter(title) + '║');
  console.log('╠' + '═'.repeat(width) + '╣');
  for (const l of lines) {
    console.log('║' + l + ' '.repeat(width - l.length) + '║');
  }
  console.log('╚' + '═'.repeat(width) + '╝\n');
}

async function pause() {
  await inquirer.prompt([
    {
      type: 'input',
      name: 'enter',
      message: 'Presiona Enter para volver al menú...',
    },
  ]);
}

async function bumpVersion() {
  const { bump } = await inquirer.prompt([
    {
      type: 'select',
      name: 'bump',
      message: '¿Qué tipo de versión deseas incrementar?',
      choices: [
        { name: 'Ninguno (mantener actual)', value: null },
        { name: 'Patch', value: 'patch' },
        { name: 'Minor', value: 'minor' },
        { name: 'Major', value: 'major' },
      ],
    },
  ]);
  if (bump) {
    if (fs.existsSync(path.resolve(__dirname, 'package.json'))) {
      runCommand(`npm version ${bump} --no-git-tag-version`);
    } else if (fs.existsSync(path.resolve(__dirname, 'scripts/version-bump.mjs'))) {
      runCommand(`node scripts/version-bump.mjs ${bump}`);
    }
    console.log('\x1b[32mVersión actualizada.\x1b[0m');
  } else {
    console.log('No se incrementará la versión.');
  }
}

async function build() {
  await bumpVersion();
  let hasBuildScript = false;
  if (fs.existsSync(path.resolve(__dirname, 'package.json'))) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));
      hasBuildScript = !!(pkg.scripts && pkg.scripts.build);
    } catch (e) {}
  }

  if (hasBuildScript) {
    runCommand('npm run build');
    console.log('\x1b[32mBuild completado.\x1b[0m');
  } else {
    console.log('Validando sintaxis de archivos...');
    if (fs.existsSync(path.resolve(__dirname, 'main.js'))) {
      try {
        execSync('node -c main.js', { stdio: 'inherit' });
        console.log('\x1b[32mSintaxis de main.js: OK\x1b[0m');
      } catch (err) {
        console.error('\x1b[31mError de sintaxis en main.js\x1b[0m');
        return;
      }
    }
    console.log('\x1b[32mBuild y validación completados.\x1b[0m');
  }
}

function inject() {
  if (!fs.existsSync(TARGET_DIR)) {
    console.log(`Creando directorio de destino: ${TARGET_DIR}`);
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  if (fs.existsSync(DIST_DIR)) {
    const files = fs.readdirSync(DIST_DIR);
    files.forEach((file) => {
      const src = path.join(DIST_DIR, file);
      if (fs.statSync(src).isFile()) {
        const dest = path.join(TARGET_DIR, file);
        fs.copyFileSync(src, dest);
        console.log(`Copiado (dist): ${file}`);
      }
    });
  } else {
    const candidateFiles = ['main.js', 'manifest.json', 'styles.css'];
    let copiedAny = false;
    candidateFiles.forEach((file) => {
      const src = path.resolve(__dirname, file);
      if (fs.existsSync(src)) {
        const dest = path.join(TARGET_DIR, file);
        fs.copyFileSync(src, dest);
        console.log(`Copiado: ${file}`);
        copiedAny = true;
      }
    });
    if (!copiedAny) {
      console.warn('\x1b[33mNo se encontraron archivos principales (main.js, manifest.json) para inyectar.\x1b[0m');
    }
  }
  console.log(`\x1b[32mInyección completada en: ${TARGET_DIR}\x1b[0m`);
}

async function gitUpdate() {
  runCommand('git add .');
  const { customMsg } = await inquirer.prompt([
    {
      type: 'input',
      name: 'customMsg',
      message: `Mensaje de commit (Enter para usar el genérico "${GENERIC_COMMIT_MSG}"):`,
    },
  ]);
  const commitMsg = customMsg.trim() || GENERIC_COMMIT_MSG;
  runCommand(`git commit -m "${commitMsg}"`);
  const { pushNow } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'pushNow',
      message: '¿Deseas hacer push ahora?',
      default: false,
    },
  ]);
  if (pushNow) {
    runCommand('git push');
    console.log('\x1b[32mPush ejecutado.\x1b[0m');
  } else {
    console.log('Push omitido.');
  }
}

async function main() {
  while (true) {
    clearScreen();
    renderMenuBox();

    const injectLabel = fs.existsSync(DIST_DIR)
      ? 'Inyección (copiar dist a Obsidian)'
      : 'Inyección (copiar a Obsidian)';

    const { choice } = await inquirer.prompt([
      {
        type: 'rawlist',
        name: 'choice',
        message: 'Selecciona una opción (utiliza las flechas de tu teclado o escribe una opción)',
        choices: [
          { name: 'Build', value: 'build' },
          { name: injectLabel, value: 'inject' },
          { name: 'Actualizar repositorio (git add/commit/push)', value: 'git' },
          { name: 'Salir', value: 'exit' },
        ],
      },
    ]);

    if (choice === 'exit') {
      clearScreen();
      console.log('Fin del deployment manager.\n');
      break;
    }

    clearScreen();
    if (choice === 'build') await build();
    else if (choice === 'inject') inject();
    else if (choice === 'git') await gitUpdate();

    console.log('');
    await pause();
  }
}

if (require.main === module) {
  main();
}
