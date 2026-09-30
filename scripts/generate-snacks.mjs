#!/usr/bin/env node
/** Generate source files that Expo Snack can load from this repository's raw URLs. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APPS = path.join(ROOT, 'apps');
const OUTPUT = path.join(ROOT, 'snacks');
const MANIFEST = path.join(ROOT, 'snack-manifest.json');
const VERSION = '0.1.0';

function sourceFiles(dir, base = '') {
  return fs.readdirSync(path.join(dir, base), { withFileTypes: true }).flatMap(entry => {
    const name = path.posix.join(base, entry.name);
    if (entry.isDirectory()) return ['node_modules', '.expo', 'assets'].includes(entry.name) ? [] : sourceFiles(dir, name);
    return /\.tsx?$/.test(name) && name !== 'index.ts' && !name.endsWith('.d.ts') ? [name] : [];
  });
}

function packageImports(code) {
  return [...code.matchAll(/(?:from\s*|import\s*)['"]([^'".][^'"]*)['"]/g)].map(match => match[1]);
}

function relativeImports(code) {
  return [...code.matchAll(/from\s*['"](\.{1,2}\/[^'"]+)['"]/g)].map(match => match[1]);
}

function snackSource(code) {
  return code.replace(/(['"])@plocks\/ui\1/g, '$1@plocks/ui-snack$1');
}

const manifest = [];
fs.rmSync(OUTPUT, { recursive: true, force: true });
fs.mkdirSync(OUTPUT, { recursive: true });

for (const directory of fs.readdirSync(APPS).filter(name => fs.existsSync(path.join(APPS, name, 'App.tsx'))).sort()) {
  const slug = directory;
  const sourceDir = path.join(APPS, directory);
  if (!fs.existsSync(path.join(sourceDir, 'App.tsx'))) {
    console.log(`Skipping ${directory}: App.tsx is not present yet`);
    continue;
  }
  const outputDir = path.join(OUTPUT, slug);
  fs.mkdirSync(outputDir, { recursive: true });
  const codeFiles = sourceFiles(sourceDir)
    .sort((a, b) => a === 'App.tsx' ? -1 : b === 'App.tsx' ? 1 : a.localeCompare(b));
  const sources = codeFiles.map(name => ({ name, code: fs.readFileSync(path.join(sourceDir, name), 'utf8') }));
  const dependencies = new Set();
  const assets = new Set();
  const knownModules = new Set(codeFiles.map(name => name.replace(/\.(tsx?|jsx?)$/, '')));
  for (const file of sources) {
    const rewritten = snackSource(file.code);
    const to = path.join(outputDir, file.name);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.writeFileSync(to, rewritten);
    for (const imported of packageImports(rewritten)) {
      if (imported.startsWith('@plocks/') && imported !== '@plocks/ui-snack') {
        dependencies.add(`${imported}@${VERSION}`);
      } else if (imported.startsWith('@react-native-') || imported.startsWith('expo-')) {
        dependencies.add(imported);
      }
    }
    for (const imported of relativeImports(rewritten)) {
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file.name), imported)).replace(/\.(tsx?|jsx?)$/, '');
      if (!knownModules.has(resolved) && !knownModules.has(`${resolved}/index`)) {
        throw new Error(`${directory}/${file.name}: missing Snack source ${imported}`);
      }
    }
    for (const match of rewritten.matchAll(/require\s*\(\s*['"](\.\/assets\/[^'"]+)['"]\s*\)/g)) {
      const asset = path.posix.normalize(path.posix.join(path.posix.dirname(file.name), match[1]));
      const from = path.join(sourceDir, asset);
      if (!fs.existsSync(from)) throw new Error(`Missing asset: ${directory}/${asset}`);
      const to = path.join(outputDir, asset);
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
      assets.add(asset);
    }
  }
  manifest.push({ slug, codeFiles, assets: [...assets].sort(), dependencies: [...dependencies].sort() });
}

fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${manifest.length} Snacks.`);
