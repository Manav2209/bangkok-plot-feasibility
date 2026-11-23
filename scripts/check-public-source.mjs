import { execFileSync } from 'node:child_process';
import { readFileSync, lstatSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const files = execFileSync(
  'git',
  [
    '-c',
    `safe.directory=${root.replaceAll('\\', '/')}`,
    'ls-files',
    '--cached',
    '--others',
    '--exclude-standard',
    '-z',
  ],
  { cwd: root, encoding: 'utf8' },
)
  .split('\0')
  .filter(Boolean);
const problems = [];
for (const file of new Set(files)) {
  const resolved = path.resolve(root, file);
  if (path.relative(root, resolved).startsWith('..'))
    throw new Error('Source file escaped workspace.');
  if (
    /(^|\/)(?:\.env(?:\..*)?|id_rsa|credentials|.*\.pem)$/.test(file) &&
    !file.endsWith('.env.example')
  ) {
    problems.push(`${file}: private-file name`);
    continue;
  }
  if (!lstatSync(resolved).isFile()) continue;
  const text = readFileSync(resolved, 'utf8');
  if (/(?:sk-(?:proj-)?[A-Za-z0-9_-]{30,}|gh[pousr]_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16})/.test(text))
    problems.push(`${file}: credential-like content`);
}
if (problems.length) throw new Error(`Do not publish these files:\n${problems.join('\n')}`);
console.log(
  `Checked ${new Set(files).size} source files: no private-file names or recognized credential patterns. This pattern scan does not prove absence of every possible secret.`,
);
