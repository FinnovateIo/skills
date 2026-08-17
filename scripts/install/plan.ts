import { copyFileSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import {
  checkFileExists,
  checkFilesHaveSameContents,
  checkSymLinkToTarget,
  listFilesForDir
} from './fileSystem.ts';
import { dim, green, heading, info, warn } from './ui.ts';
import { isInteractive } from './cli.ts';
import { resolveConflict, type ConflictAnswer } from './prompts.ts';

export type EntryStatus = 'new' | 'unchanged' | 'conflict';
export type EntryAction = 'install' | 'skip';
export type EntryConflictDecision = Extract<
  ConflictAnswer,
  'skip' | 'overwrite'
>;

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
        info(`  ${dim('skip')}     ${entry.relToTarget}`);
      }

      return;
    }

    installEntry(entry, shouldDryRun, shouldLink);
    installed++;
    info(
      shouldDryRun
        ? `  ${dim('[dry-run]')} ${entry.relToTarget}`
        : `  ${green('+')}        ${entry.relToTarget}`
    );
  });

  return { installed, skipped };
};

const resolveConflictDecisions = async (
  entries: readonly PlanEntry[]
): Promise<Map<string, EntryConflictDecision>> => {
  const decisions = new Map<string, EntryConflictDecision>();
  let persistedDecision: EntryConflictDecision | null = null;

  entries.forEach(async (entry) => {
    if (persistedDecision) {
      decisions.set(entry.dest, persistedDecision);
      return;
    }

    const answer = await resolveConflict(entry);
    if (answer === 'skip-all' || answer === 'overwrite-all') {
      persistedDecision = answer === 'overwrite-all' ? 'overwrite' : 'skip';
      decisions.set(entry.dest, persistedDecision);
      return;
    }

    decisions.set(entry.dest, answer);
  });

  return decisions;
};

export const resolveConflicts = async (
  entries: readonly PlanEntry[],
  shouldForce: boolean
): Promise<PlanEntry[]> => {
  const conflicts = entries.filter((entry) => entry.status === 'conflict');

  if (!conflicts.length || shouldForce) {
    return shouldForce
      ? entries.map((entry) =>
          entry.status === 'conflict' ? { ...entry, action: 'install' } : entry
        )
      : [...entries];
  }

  if (!isInteractive) {
    warn(
      `Not running interactively — keeping the ${conflicts.length} existing file(s). Use --force to overwrite.`
    );
    return [...entries];
  }

  heading(`${conflicts.length} file(s) already exist and differ`);

  const decisions = await resolveConflictDecisions(conflicts);

  return entries.map((entry) =>
    decisions.get(entry.dest) === 'overwrite'
      ? { ...entry, action: 'install' }
      : entry
  );
};
