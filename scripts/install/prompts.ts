import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { confirm, input, select } from '@inquirer/prompts';
import { bold, dim, info } from './ui.js';
import { ttyStream } from './cli.js';
import type { Context } from '@inquirer/type';

export type ConflictEntry = {
  src: string;
  dest: string;
  relToTarget: string;
};

export type ConflictAnswer =
  'skip' | 'overwrite' | 'skip-all' | 'overwrite-all';

type ConflictChoice = ConflictAnswer | 'diff';

const ask = async <C, R>(
  prompt: (config: C, context?: Context) => Promise<R>,
  config: C
): Promise<R> => {
  const context = ttyStream ? { input: ttyStream } : undefined;
  try {
    return await prompt(config, context);
  } catch (error) {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      info('\nCancelled.');
      process.exit(130);
    }
    throw error;
  }
};

export const chooseTarget = async ({
  home,
  cwd
}: {
  home: string;
  cwd: string;
}): Promise<string> => {
  const choice = await ask(select, {
    message: 'Where should this be installed?',
    choices: [
      {
        name: `${cwd}/.claude`,
        value: `${cwd}/.claude`,
        description: 'This project only'
      },
      {
        name: `${home}/.claude`,
        value: `${home}/.claude`,
        description: 'Global — applies to every project'
      },
      { name: 'A custom path…', value: 'custom' }
    ]
  });

  if (choice !== 'custom') return choice;

  return ask(input, {
    message: 'Path:',
    validate: (value) => (value.trim() ? true : 'Enter a path.')
  });
};

export const confirmUnusualTarget = (target: string): Promise<boolean> =>
  ask(confirm, {
    message: `${target} does not end in '.claude', so Claude Code may not read it. Use it anyway?`,
    default: false
  });

export const confirmDependencies = (
  dependencies: readonly string[]
): Promise<boolean> =>
  ask(confirm, {
    message: `Also install ${dependencies.join(', ')}?`,
    default: true
  });

const lineCount = (path: string): number => {
  try {
    return readFileSync(path, 'utf8').split('\n').length;
  } catch {
    return 0;
  }
};

const showDiff = (entry: ConflictEntry): void => {
  const result = spawnSync(
    'diff',
    [
      '-u',
      '--label',
      `existing: ${entry.relToTarget}`,
      '--label',
      `incoming: ${entry.relToTarget}`,
      entry.dest,
      entry.src
    ],
    { encoding: 'utf8' }
  );

  if (result.error) {
    info(dim('  (diff is not available on this system)'));
    return;
  }
  info(`\n${result.stdout}`);
};

export const resolveConflict = async (
  entry: ConflictEntry
): Promise<ConflictAnswer> => {
  for (;;) {
    const answer = await ask(select<ConflictChoice>, {
      message: `${bold(entry.relToTarget)} ${dim(
        `(existing ${lineCount(entry.dest)} lines, incoming ${lineCount(entry.src)} lines)`
      )}`,
      choices: [
        { name: 'Skip — keep the existing file', value: 'skip' },
        { name: 'Overwrite with this repo’s version', value: 'overwrite' },
        { name: 'Show diff', value: 'diff' },
        { name: 'Skip all remaining conflicts', value: 'skip-all' },
        {
          name: 'Overwrite all remaining conflicts',
          value: 'overwrite-all'
        }
      ]
    });

    if (answer !== 'diff') return answer;
    showDiff(entry);
  }
};
