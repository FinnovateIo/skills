// Install Finnovate rules and skills into a Claude Code configuration
// directory. Run it through ./install.sh, which checks dependencies first.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { InstallError } from './scripts/install/ui.ts';
import { runInstaller } from './scripts/install/installer.ts';

const ROOT = dirname(fileURLToPath(import.meta.url));
const RULES_SRC = join(ROOT, 'rules');
const SKILLS_SRC = join(ROOT, 'skills');

try {
  await runInstaller(ROOT, RULES_SRC, SKILLS_SRC);
} catch (error) {
  if (error instanceof InstallError) {
    console.error(`\n${error.message}`);
    for (const line of error.details) console.error(line);
    process.exit(1);
  }
  throw error;
}
