import { access, readdir, readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const html = await readFile(join(root, 'index.html'), 'utf8');
const failures = [];
const warnings = [];

const ignoredDirs = new Set(['.git', '.lighthouseci', 'node_modules', 'reports', 'test-results', 'assets/vendor']);
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.txt', '.xml']);
const mojibakeTokens = ['\uCA0C', '\uCC55', '\uD69E', '\uBBB6', '\uBD55', '\uBC1A', '\uBC23', '\uBC04', '\uBC2A', '\uBC33', '\uBC20', '\uBC06', '\uAC4E', '\uBB56', '\uBBCA', '\uBBCB', '\u7F50', '\u6B3E', '\u8CAB'];
const mojibakeRegexes = [
  ['replacement-character', /\uFFFD/],
  ['latin1-utf8-c1', /\u00C3[\u0080-\u00BF]/],
  ['stray-cp1252-latin1', /\u00C2[\u0080-\u00BF]?/],
  ['cp1252-punctuation', /\u00E2[\u0080-\u2122]{1,2}/],
  ['emoji-mojibake', /\u00F0\u0178[\u0080-\u00BF]?/],
  ['known-rendered-mojibake-token', new RegExp(mojibakeTokens.map(escapeRegExp).join('|'))]
];

for (const forbidden of ['fonts.googleapis.com', 'fonts.gstatic.com']) {
  if (html.includes(forbidden)) failures.push(`external font host still referenced: ${forbidden}`);
}
if (/Content-Security-Policy/i.test(html) && html.includes("'unsafe-inline'")) {
  warnings.push('CSP still allows unsafe-inline; move inline styles/scripts to hashed or external assets before a hardened release');
}

const attrPattern = /\b(?:href|src|srcset)=["']([^"']+)["']/g;
for (const match of html.matchAll(attrPattern)) {
  const refs = match[0].startsWith('srcset=')
    ? match[1].split(',').map((candidate) => candidate.trim().split(/\s+/)[0]).filter(Boolean)
    : [match[1]];
  for (const ref of refs) {
    if (!ref || shouldSkip(ref)) continue;
    const clean = ref.split('#')[0].split('?')[0];
    if (!clean) continue;
    try {
      await access(join(root, clean));
    } catch {
      failures.push(`missing local asset: ${ref}`);
    }
  }
}

const evidence = JSON.parse(await readFile(join(root, 'assets', 'evidence-summary.json'), 'utf8'));
if (evidence.schemaVersion !== 'pendulum-evidence-summary/v1') {
  failures.push(`unexpected evidence schema: ${evidence.schemaVersion ?? 'missing'}`);
}
if (!Number.isFinite(evidence.tests?.total) || evidence.tests.total <= 0) {
  failures.push('evidence summary is missing a positive tests.total');
}
checkEvidenceFreshness(evidence);
await compareMainEvidenceIfProvided(evidence);
await checkTextEncoding();

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn(warnings.map((warning) => `- warning: ${warning}`).join('\n'));
}
console.log('static asset check passed');

function shouldSkip(ref) {
  return (
    ref.startsWith('#') ||
    ref.startsWith('data:') ||
    ref.startsWith('mailto:') ||
    ref.startsWith('tel:') ||
    ref.startsWith('http://') ||
    ref.startsWith('https://')
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function checkEvidenceFreshness(summary) {
  const maxAgeDays = Number.parseFloat(process.env.PENDULUM_EVIDENCE_MAX_AGE_DAYS || '14');
  const generated = Date.parse(summary.generatedAt || '');
  if (!Number.isFinite(generated)) {
    failures.push('evidence summary generatedAt is missing or invalid');
    return;
  }
  const ageDays = (Date.now() - generated) / 86_400_000;
  if (ageDays > maxAgeDays) {
    warnings.push(`evidence summary is ${ageDays.toFixed(1)} days old; refresh from the main repo before release`);
  }
}

async function compareMainEvidenceIfProvided(summary) {
  const evidencePath = process.env.PENDULUM_LAB_EVIDENCE_PATH;
  if (!evidencePath) return;
  const source = JSON.parse(await readFile(evidencePath, 'utf8'));
  for (const key of ['schemaVersion', 'generatedAt']) {
    if (source[key] !== summary[key]) failures.push(`evidence ${key} mismatch: landing=${summary[key]} main=${source[key]}`);
  }
  for (const key of ['total', 'passed', 'failed', 'files']) {
    if (source.tests?.[key] !== summary.tests?.[key]) failures.push(`evidence tests.${key} mismatch: landing=${summary.tests?.[key]} main=${source.tests?.[key]}`);
  }
  if (source.gpu?.status !== summary.gpu?.status) failures.push(`evidence gpu.status mismatch: landing=${summary.gpu?.status} main=${source.gpu?.status}`);
  if (source.publication?.status !== summary.publication?.status) failures.push(`evidence publication.status mismatch: landing=${summary.publication?.status} main=${source.publication?.status}`);
}

async function checkTextEncoding() {
  for (const file of await walk(root)) {
    const rel = relative(root, file).replace(/\\/g, '/');
    const text = await readFile(file, 'utf8');
    text.split(/\r?\n/).forEach((line, index) => {
      for (const [label, regex] of mojibakeRegexes) {
        regex.lastIndex = 0;
        if (!regex.test(line)) continue;
        failures.push(`mojibake ${label}: ${rel}:${index + 1}: ${line.trim().slice(0, 140)}`);
      }
      if (/\?{2,}/.test(line) && !looksLikeCode(line)) {
        failures.push(`mojibake literal-question-run-in-display-text: ${rel}:${index + 1}: ${line.trim().slice(0, 140)}`);
      }
      if (/\?{2,}<\/|<[^>]*>\?{2,}\/?[a-z]/i.test(line)) {
        failures.push(`possibly mangled HTML token: ${rel}:${index + 1}: ${line.trim().slice(0, 140)}`);
      }
    });
  }
}

function looksLikeCode(line) {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.includes('${') ||
    trimmed.includes('=>') ||
    /\b(?:const|let|var|return|if|for|while|switch|case|type|interface|export|import)\b/.test(trimmed) ||
    ((trimmed.includes('??') || trimmed.includes('?.')) && /[`=;(){}[\]]/.test(trimmed))
  );
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir)) {
    const path = join(dir, entry);
    const rel = relative(root, path).replace(/\\/g, '/');
    if ([...ignoredDirs].some((ignored) => rel === ignored || rel.startsWith(`${ignored}/`))) continue;
    const info = await stat(path);
    if (info.isDirectory()) out.push(...await walk(path));
    else if (info.isFile() && textExtensions.has(extname(path).toLowerCase())) out.push(path);
  }
  return out;
}
