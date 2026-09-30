#!/usr/bin/env node
/** Export every standalone app below /demos/<slug> for a shared static host. */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, process.argv[2] ?? 'dist/demos');
const only = process.argv[3];
const appNames = fs.readdirSync(path.join(root, 'apps'))
  .filter((name) => fs.existsSync(path.join(root, 'apps', name, 'App.tsx')))
  .filter((name) => !only || name === only)
  .sort();

if (!appNames.length) throw new Error(`No demo app matches ${only ?? 'the apps directory'}`);
fs.mkdirSync(output, { recursive: true });

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

function sourceFiles(directory, prefix = '') {
  return fs.readdirSync(path.join(directory, prefix), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      return ['assets', 'node_modules', '.expo', 'dist'].includes(entry.name) ? [] : sourceFiles(directory, relative);
    }
    return /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [relative] : [];
  }).sort((a, b) => a === 'App.tsx' ? -1 : b === 'App.tsx' ? 1 : a.localeCompare(b));
}

function writeSourcePage(appRoot, destination, slug) {
  const files = sourceFiles(appRoot);
  const links = files.map((name, index) => `<a href="#file-${index}">${escapeHtml(name)}</a>`).join('');
  const sections = files.map((name, index) => `<section id="file-${index}"><h2>${escapeHtml(name)}</h2><pre><code>${escapeHtml(fs.readFileSync(path.join(appRoot, name), 'utf8'))}</code></pre></section>`).join('');
  fs.writeFileSync(path.join(destination, 'source.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(slug)} · plocks demo source</title>
<style>body{margin:0;background:#111319;color:#eef0f3;font:15px system-ui,sans-serif}header{padding:24px;position:sticky;top:0;background:#1b1e26;border-bottom:1px solid #353a46}h1{font-size:20px;margin:0 0 12px}nav{display:flex;gap:12px;flex-wrap:wrap}a{color:#9dbeff}main{max-width:1100px;margin:auto;padding:24px}section{margin-bottom:32px;scroll-margin-top:130px}h2{font-size:18px}pre{overflow:auto;background:#1b1e26;border:1px solid #353a46;border-radius:10px;padding:18px;line-height:1.5}code{font:13px ui-monospace,SFMono-Regular,monospace}</style>
</head><body><header><h1>${escapeHtml(slug)} source</h1><nav><a href="/demos/${encodeURIComponent(slug)}/">Open live demo</a>${links}</nav></header><main>${sections}</main></body></html>`);
}

for (const [index, name] of appNames.entries()) {
  const slug = name;
  const appRoot = path.join(root, 'apps', name);
  const config = JSON.parse(fs.readFileSync(path.join(appRoot, 'app.json'), 'utf8'));
  if (config.expo?.experiments?.baseUrl !== `/demos/${slug}`) {
    throw new Error(`${name} must set experiments.baseUrl to /demos/${slug}`);
  }

  console.log(`Exporting ${slug} (${index + 1}/${appNames.length})`);
  // Keep each export within the memory budget of the docs deployment runner.
  const result = spawnSync(process.execPath, [
    path.join(root, 'node_modules/expo/bin/cli'),
    'export', '--platform', 'web', '--max-workers', '2', '--output-dir', path.join(output, slug),
  ], { cwd: appRoot, stdio: 'inherit', env: process.env });
  if (result.error || result.signal || result.status !== 0) {
    throw new Error(`${slug} export failed: ${result.error?.message ?? result.signal ?? `exit code ${result.status}`}`);
  }
  if (!fs.existsSync(path.join(output, slug, 'index.html'))) {
    throw new Error(`${slug} did not produce index.html`);
  }
  writeSourcePage(appRoot, path.join(output, slug), slug);
}

console.log(`Exported ${appNames.length} demos to ${output}`);
