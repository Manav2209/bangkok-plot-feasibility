import { cp, lstat, realpath, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const destination = path.resolve(root, 'dist');
const source = path.resolve(root, 'apps/web/dist');
if (
  path.relative(root, destination) !== 'dist' ||
  path.relative(root, source) !== path.join('apps', 'web', 'dist')
)
  throw new Error('Build output escaped the workspace.');
if (!(await lstat(path.join(source, 'index.html'))).isFile())
  throw new Error('Build the web app before preparing deployment assets.');
// Delete only the resolved, checked workspace build-output directory, never the source tree.
await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });
console.log(`Prepared static deployment output: ${destination}`);
