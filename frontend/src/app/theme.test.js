import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';


const sourceRoot = fileURLToPath(new URL('../', import.meta.url));


const readSourceFiles = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name);

  if (entry.isDirectory()) return readSourceFiles(path);
  if (!['.css', '.js', '.jsx'].includes(extname(entry.name))) return [];
  if (entry.name.endsWith('.test.js')) return [];

  return [{ path, content: readFileSync(path, 'utf8') }];
});


test('frontend declares the approved Modern Minimalist palette', () => {
  const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8').toLowerCase();

  for (const color of ['#36454f', '#708090', '#d3d3d3', '#f4f5f5', '#ffffff']) {
    assert.equal(css.includes(color), true, `Missing Modern Minimalist color: ${color}`);
  }
});


test('frontend declares the Cyber Obsidian Studio tokens and utility classes', () => {
  const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

  const requiredTokens = [
    '--studio-canvas',
    '--studio-panel',
    '--studio-panel-elevated',
    '--studio-border',
    '--studio-border-glow',
    '--studio-emerald',
    '--studio-cyan',
    '--studio-amber',
    '--studio-crimson',
  ];

  for (const token of requiredTokens) {
    assert.equal(css.includes(token), true, `Missing Cyber Obsidian token: ${token}`);
  }

  const requiredClasses = [
    '.studio-canvas',
    '.studio-panel',
    '.studio-panel-elevated',
    '.studio-glass',
    '.studio-glow-emerald',
    '.studio-glow-cyan',
  ];

  for (const className of requiredClasses) {
    assert.equal(css.includes(className), true, `Missing Studio utility class: ${className}`);
  }
});


test('frontend exports reusable Studio motion primitives', () => {
  const primitivesContent = readFileSync(
    join(sourceRoot, 'components', 'studio', 'StudioPrimitives.jsx'),
    'utf8'
  );

  const requiredExports = [
    'export function StudioCard',
    'export function StudioBadge',
    'export function StudioButton',
    'export function StudioPillTab',
    'export function StudioMotionDrawer',
  ];

  for (const exp of requiredExports) {
    assert.equal(
      primitivesContent.includes(exp),
      true,
      `Missing Studio motion primitive export: ${exp}`
    );
  }
});


test('frontend no longer uses the previous blue product palette', () => {
  const oldColors = ['#17324d', '#245fce', '#1e51b3', '#10263a', '#102a43', '#f8f8f4', '#f3f1ea'];
  const violations = [];

  for (const file of readSourceFiles(sourceRoot)) {
    const content = file.content.toLowerCase();
    for (const color of oldColors) {
      if (content.includes(color)) violations.push(`${file.path}: ${color}`);
    }
  }

  assert.deepEqual(violations, []);
});


test('frontend copy contains no common mojibake characters', () => {
  const violations = readSourceFiles(sourceRoot)
    .filter((file) => /[\u00c2\u00c3\u00e2]/u.test(file.content))
    .map((file) => file.path);

  assert.deepEqual(violations, []);
});


test('marketing copy does not call unverified provider candidates verified', () => {
  const marketingFiles = ['LandingPage.jsx', 'Login.jsx', 'UploadResume.jsx'];
  const violations = marketingFiles.filter((name) => {
    const content = readFileSync(join(sourceRoot, 'pages', name), 'utf8');
    return /verified roles|verified page|verified resume skills/i.test(content);
  });

  assert.deepEqual(violations, []);
});
