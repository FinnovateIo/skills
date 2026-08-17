import { copyFileSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import {
  checkFileExists,
  checkFilesHaveSameContents,
  checkSymLinkToTarget,
  listFilesForDir
} from './fileSystem.ts';
import { dim, green, heading, info, warn } from './ui.ts';

export type EntryStatus = 'new' | 'unchanged' | 'conflict';
export type EntryAction = 'install' | 'skip';

export type PlanEntry = {
  src: string;
  dest: string;
  rel: string;
  status: EntryStatus;
  action: EntryAction;
  relToTarget: string;
};

export type Group = {
  sourceRoot: string;
  destRoot: string;
  prefix: string;
};

export type StatusTotals = Record<EntryStatus, number>;

export type Report = {
  installed: (entry: PlanEntry, dryRun: boolean) => void;
  skipped: (entry: PlanEntry) => void;
};

export const classify = (
  src: string,
  dest: string,
  shouldLink: boolean
): EntryStatus => {
  if (checkSymLinkToTarget(dest, src)) return 'unchanged';
  if (!checkFileExists(dest)) return 'new';
  if (checkFilesHaveSameContents(src, dest))
    return shouldLink ? 'new' : 'unchanged';
  return 'conflict';
};

export const buildPlan = (
  groups: readonly Group[],
  target: string,
  shouldLink: boolean
): PlanEntry[] =>
  groups.flatMap(({ sourceRoot, destRoot, prefix }) =>
    listFilesForDir(sourceRoot).map((file) => {
      const src = join(sourceRoot, file);
      const dest = join(destRoot, file);
      const status = classify(src, dest, shouldLink);
      return {
        src,
        dest,
        rel: join(prefix, file),
        status,
        action: status === 'new' ? 'install' : 'skip',
        relToTarget: relative(target, dest)
      };
    })
  );

export const countByStatus = (entries: readonly PlanEntry[]): StatusTotals =>
  entries.reduce<StatusTotals>(
    (totals, entry) => ({
      ...totals,
      [entry.status]: totals[entry.status] + 1
    }),
    { new: 0, unchanged: 0, conflict: 0 }
  );

const installEntry = (
  entry: PlanEntry,
  shouldDryRun: boolean,
  shouldLink: boolean
): void => {
  if (shouldDryRun) return;

  mkdirSync(dirname(entry.dest), { recursive: true });
  rmSync(entry.dest, { force: true });

  if (shouldLink) {
    symlinkSync(entry.src, entry.dest);
  } else {
    copyFileSync(entry.src, entry.dest);
  }
};

export const executePlan = (
  entries: readonly PlanEntry[],
  shouldDryRun: boolean,
  shouldLink: boolean
): { installed: number; skipped: number } => {
  let installed = 0;
  let skipped = 0;

  entries.forEach((entry) => {
    if (entry.action !== 'install') {
      skipped++;

      if (entry.status === 'conflict') {
        info(`\t${dim('skip')}\t${entry.relToTarget}`);
      }

      return;
    }

    installEntry(entry, shouldDryRun, shouldLink);
    installed++;
    info(
      shouldDryRun
        ? `\t${dim('[dry-run]')}\t${entry.relToTarget}`
        : `\t${green('+')}\t${entry.relToTarget}`
    );
  });

  return { installed, skipped };
};
