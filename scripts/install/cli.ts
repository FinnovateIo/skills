import { accessSync, constants, existsSync, openSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { ReadStream } from 'node:tty';
import { InstallError, bold } from './ui.js';

export const USAGE = `${bold('Finnovate rules and skills installer')}

  ./install.sh [options]

With no options, installs every rule and skill and asks where to put them.

${bold('What to install')}
  --rules a,b      Only these rule categories (or 'all', or 'none')
  --skills x,y     Only these skills (or 'all', or 'none')
  --list           Show what this repo provides, then exit

${bold('Where to install')}
  --global         Install to ~/.claude
  --local          Install to ./.claude (current directory)
  --target PATH    Install to an explicit path

${bold('How to install')}
  --link           Symlink to this repo instead of copying, so a
                   'git pull' updates the installed files in place
  --dry-run        Show what would happen, write nothing
  --force          Overwrite conflicting files without prompting
  -h, --help       This message
`;

export const parseOptions = () => {
  try {
    return parseArgs({
      options: {
        rules: { type: 'string' },
        skills: { type: 'string' },
        target: { type: 'string' },
        global: { type: 'boolean', default: false },
        local: { type: 'boolean', default: false },
        link: { type: 'boolean', default: false },
        'dry-run': { type: 'boolean', default: false },
        force: { type: 'boolean', default: false },
        list: { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false }
      },
      allowPositionals: false,
      strict: true
    }).values;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new InstallError(error.message, ['', USAGE]);
    }
  }
};

export const expandPath = (path: string) =>
  path.startsWith('~/') ? join(homedir(), path.slice(2)) : resolve(path);

// Given a target destination, if it does not exist, find its nearest ancestor and check for write permissions
export const checkTargetIsWritable = (targetPath: string) => {
  let path = targetPath;

  while (!existsSync(path)) {
    const parent = dirname(path);
    if (parent === path) {
      break;
    }
    path = parent;
  }

  try {
    accessSync(path, constants.W_OK);
  } catch {
    throw new InstallError(`Cannot write to ${path} — check permissions.`);
  }
};

export const openTty = () => {
  if (process.stdin.isTTY) return null;
  try {
    const stream = new ReadStream(openSync('/dev/tty', 'r'));
    return stream;
  } catch {
    return null;
  }
};

export const ttyStream = openTty();
export const isInteractive = ttyStream !== null;
