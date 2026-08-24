import { basename, join } from 'node:path';
import { isInteractive, type Options } from './cli.ts';
import { homedir } from 'node:os';
import { InstallError } from './ui.ts';
import { chooseTarget, confirmUnusualTarget } from './prompts.ts';
import { expandPath } from './fileSystem.ts';

export const resolveTarget = async (options: Options): Promise<string> => {
  if (options.target) return expandPath(options.target);
  if (options.global) return join(homedir(), '.claude');
  if (options.local) return join(process.cwd(), '.claude');

  if (!isInteractive) {
    throw new InstallError('No destination given.', [
      'Use --global, --local, or --target PATH.'
    ]);
  }

  while (true) {
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
