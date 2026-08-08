import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IGNORED = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);
const IGNORED_PREFIXES = ['android/app/src/main/assets/'];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.html', '.yml', '.yaml']);
const findings = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) scanFile(full);
  }
}

function scanFile(fullPath) {
  const relative = path.relative(ROOT, fullPath);
  if (relative === 'package-lock.json' || IGNORED_PREFIXES.some((prefix) => relative.startsWith(prefix))) return;
  const text = fs.readFileSync(fullPath, 'utf8');
  text.split('\n').forEach((line, index) => {
    if (/\b(TODO|FIXME|HACK)\b/i.test(line) && !line.includes('TODO|FIXME|HACK')) add('low', 'maintenance-markers', relative, index + 1, 'Maintenance marker found');
    if (/AIza[0-9A-Za-z_-]{20,}/.test(line) || /(api[_-]?key|token|secret|password)\s*[:=]\s*["'][^"']{12,}["']/i.test(line)) add('high', 'secret-patterns', relative, index + 1, 'Possible hard-coded secret');
    if (/console\.(log|debug)\(/.test(line) && /\.[tj]sx?$/.test(relative)) add('medium', 'production-noise', relative, index + 1, 'Console logging in application code');
  });
}

function add(severity, scanner, file, line, title) {
  findings.push({ severity, scanner, file, line, title });
}

walk(ROOT);
console.log(JSON.stringify({ findingCount: findings.length, findings }, null, 2));
if (findings.some((finding) => finding.severity === 'high')) process.exitCode = 1;
