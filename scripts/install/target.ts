import { basename, dirname, join } from 'node:path';
import { expandPath, isInteractive, type Options } from './cli.ts';
import { homedir } from 'node:os';
import { InstallError } from './ui.ts';
import { chooseTarget, confirmUnusualTarget } from './prompts.ts';
import { accessSync, constants, existsSync } from 'node:fs';

export const resolveTarget = async (options: Options): Promise<string> => {
  if (options.target) return expandPath(options.target);
  if (options.global) return join(homedir(), '.claude');
  if (options.local) return join(process.cwd(), '.claude');

  if (!isInteractive) {
    throw new InstallError('No destination given.', [
      'Use --global, --local, or --target PATH.'
    ]);
  }

  for (;;) {
    const chosenTarget = expandPath(
      await chooseTarget({ home: homedir(), cwd: process.cwd() })
    );

    if (basename(chosenTarget) === '.claude') {
      return chosenTarget;
    }

    const isConfirm = await confirmUnusualTarget(chosenTarget);
    if (isConfirm) {
      return chosenTarget;
    }
  }
};

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
