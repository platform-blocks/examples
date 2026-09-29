#!/usr/bin/env node
/** Generate source files that Expo Snack can load from this repository's raw URLs. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APPS = path.join(ROOT, 'apps');
const OUTPUT = path.join(ROOT, 'snacks');
const MANIFEST = path.join(ROOT, 'snack-manifest.json');
const SHARED_UI = path.join(APPS, 'example-common/ExampleUI.tsx');
const VERSION = '0.1.0';

function packageImports(code) {
  return [...code.matchAll(/(?:from\s*|import\s*)['"]([^'".][^'"]*)['"]/g)].map(match => match[1]);
}

function snackSource(code) {
  return code
    .replace(/(['"])@plocks\/ui\1/g, '$1@plocks/ui-snack$1')
    .replace(/(['"])\.\.\/example-common\/ExampleUI\1/g, '$1./ExampleUI$1');
}

const manifest = [];
fs.rmSync(OUTPUT, { recursive: true, force: true });
fs.mkdirSync(OUTPUT, { recursive: true });

for (const directory of fs.readdirSync(APPS).filter(name => /^plocks-.+-app$/.test(name)).sort()) {
  const slug = directory.slice('plocks-'.length, -'-app'.length);
  const sourceDir = path.join(APPS, directory);
  if (!fs.existsSync(path.join(sourceDir, 'App.tsx'))) {
    console.log(`Skipping ${directory}: App.tsx is not present yet`);
    continue;
  }
  const outputDir = path.join(OUTPUT, slug);
  fs.mkdirSync(outputDir, { recursive: true });
  const codeFiles = fs.readdirSync(sourceDir)
    .filter(name => /\.tsx?$/.test(name) && name !== 'index.ts' && !name.endsWith('.d.ts'))
    .sort((a, b) => a === 'App.tsx' ? -1 : b === 'App.tsx' ? 1 : a.localeCompare(b));
  const sources = codeFiles.map(name => ({ name, code: fs.readFileSync(path.join(sourceDir, name), 'utf8') }));
  if (sources.some(file => file.code.includes('../example-common/ExampleUI'))) {
    codeFiles.push('ExampleUI.tsx');
    sources.push({ name: 'ExampleUI.tsx', code: fs.readFileSync(SHARED_UI, 'utf8') });
  }

  const dependencies = new Set();
  const assets = new Set();
  for (const file of sources) {
    const rewritten = snackSource(file.code);
    fs.writeFileSync(path.join(outputDir, file.name), rewritten);
    for (const imported of packageImports(rewritten)) {
      if (imported.startsWith('@plocks/') && imported !== '@plocks/ui-snack') {
        dependencies.add(`${imported}@${VERSION}`);
      } else if (imported.startsWith('@react-native-') || imported.startsWith('expo-')) {
        dependencies.add(imported);
      }
    }
    for (const match of rewritten.matchAll(/require\s*\(\s*['"](\.\/assets\/[^'"]+)['"]\s*\)/g)) {
      const asset = match[1].slice(2);
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
