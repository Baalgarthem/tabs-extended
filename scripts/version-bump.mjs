import { readFileSync, writeFileSync, existsSync } from "fs";
import { execSync } from "child_process";

function bumpSemver(version, type) {
  const parts = version.split('.').map(n => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  if (type === 'major') return `${parts[0] + 1}.0.0`;
  if (type === 'minor') return `${parts[0]}.${parts[1] + 1}.0`;
  if (type === 'patch') return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
  return version;
}

let targetVersion = process.env.npm_package_version;
const arg = process.argv[2];

if (!targetVersion) {
  let currentVersion = '1.0.0';
  if (existsSync('package.json')) {
    try {
      const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
      if (pkg.version) currentVersion = pkg.version;
    } catch (e) {}
  } else if (existsSync('manifest.json')) {
    try {
      const m = JSON.parse(readFileSync('manifest.json', 'utf8'));
      if (m.version) currentVersion = m.version;
    } catch (e) {}
  } else if (existsSync('src/manifest.json')) {
    try {
      const m = JSON.parse(readFileSync('src/manifest.json', 'utf8'));
      if (m.version) currentVersion = m.version;
    } catch (e) {}
  }

  if (arg === 'major' || arg === 'minor' || arg === 'patch') {
    targetVersion = bumpSemver(currentVersion, arg);
  } else if (arg && /^\d+\.\d+\.\d+/.test(arg)) {
    targetVersion = arg;
  } else {
    targetVersion = bumpSemver(currentVersion, 'patch');
  }
}

console.log(`[version-bump] Actualizando a versión: ${targetVersion}`);

let minAppVersion = '0.15.0';

// 1. package.json
if (existsSync('package.json')) {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    pkg.version = targetVersion;
    writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    console.log(`[version-bump] package.json -> ${targetVersion}`);
  } catch (e) {
    console.error('[version-bump] Error en package.json:', e.message);
  }
}

// 2. manifest.json
if (existsSync('manifest.json')) {
  try {
    const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
    if (manifest.minAppVersion) minAppVersion = manifest.minAppVersion;
    manifest.version = targetVersion;
    writeFileSync('manifest.json', JSON.stringify(manifest, null, '\t') + '\n');
    console.log(`[version-bump] manifest.json -> ${targetVersion}`);
  } catch (e) {
    console.error('[version-bump] Error en manifest.json:', e.message);
  }
}

// 3. src/manifest.json
if (existsSync('src/manifest.json')) {
  try {
    const manifest = JSON.parse(readFileSync('src/manifest.json', 'utf8'));
    if (manifest.minAppVersion) minAppVersion = manifest.minAppVersion;
    manifest.version = targetVersion;
    writeFileSync('src/manifest.json', JSON.stringify(manifest, null, '\t') + '\n');
    console.log(`[version-bump] src/manifest.json -> ${targetVersion}`);
  } catch (e) {
    console.error('[version-bump] Error en src/manifest.json:', e.message);
  }
}

// 4. dist/manifest.json
if (existsSync('dist/manifest.json')) {
  try {
    const distManifest = JSON.parse(readFileSync('dist/manifest.json', 'utf8'));
    distManifest.version = targetVersion;
    writeFileSync('dist/manifest.json', JSON.stringify(distManifest, null, '\t') + '\n');
    console.log(`[version-bump] dist/manifest.json -> ${targetVersion}`);
  } catch (e) {
    console.error('[version-bump] Error en dist/manifest.json:', e.message);
  }
}

// 5. versions.json
if (existsSync('versions.json')) {
  try {
    const versions = JSON.parse(readFileSync('versions.json', 'utf8'));
    versions[targetVersion] = minAppVersion;
    writeFileSync('versions.json', JSON.stringify(versions, null, '\t') + '\n');
    console.log(`[version-bump] versions.json -> "${targetVersion}": "${minAppVersion}"`);
  } catch (e) {
    console.error('[version-bump] Error en versions.json:', e.message);
  }
}

// 6. git staging
try {
  execSync('git add .', { stdio: 'inherit' });
  console.log('[version-bump] Cambios agregados a git staging.');
} catch (e) {}
