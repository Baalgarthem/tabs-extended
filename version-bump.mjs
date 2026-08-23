import { readFileSync, writeFileSync, existsSync } from "fs";
import { execSync } from "child_process";

// 1. Read package.json to get the new version
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const targetVersion = pkg.version;
console.log(`[version-bump] Updating plugin metadata to version: ${targetVersion}`);

// 2. Update manifest.json
if (existsSync("manifest.json")) {
  const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
  const minAppVersion = manifest.minAppVersion;
  manifest.version = targetVersion;
  writeFileSync("manifest.json", JSON.stringify(manifest, null, 2) + "\n");
  console.log(`[version-bump] Updated manifest.json -> version ${targetVersion}`);

  // 3. Update versions.json if present
  if (existsSync("versions.json")) {
    const versions = JSON.parse(readFileSync("versions.json", "utf8"));
    versions[targetVersion] = minAppVersion;
    writeFileSync("versions.json", JSON.stringify(versions, null, 2) + "\n");
    console.log(`[version-bump] Updated versions.json with entry: "${targetVersion}": "${minAppVersion}"`);
  }
}

// 4. Update dist/manifest.json if dist exists
if (existsSync("dist/manifest.json")) {
  const distManifest = JSON.parse(readFileSync("dist/manifest.json", "utf8"));
  distManifest.version = targetVersion;
  writeFileSync("dist/manifest.json", JSON.stringify(distManifest, null, 2) + "\n");
  console.log(`[version-bump] Updated dist/manifest.json -> version ${targetVersion}`);
}

// 5. Automatic git staging
try {
  console.log("[version-bump] Executing git add .");
  execSync("git add .", { stdio: "inherit" });
  console.log("[version-bump] Changes staged successfully for npm version commit.");
} catch (err) {
  console.warn("[version-bump] Notice: git add . had non-zero exit or was run outside a git commit flow.");
}
