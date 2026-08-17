import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { bold, dim, heading, info, InstallError, warn } from './ui.ts';
import { isInteractive } from './cli.ts';
import {
  confirmDependencies,
  resolveConflict,
  type ConflictAnswer
} from './prompts.ts';
import { readFile } from './fileSystem.ts';
import type { PlanEntry } from './plan.ts';

export type EntryConflictDecision = Extract<
  ConflictAnswer,
  'skip' | 'overwrite'
>;

export type Reference = {
  from: string;
  dependency: string;
};

export const resolveSelection = (
  requested: string | undefined,
  available: readonly string[],
  label: string
): string[] => {
  if (requested === undefined || requested === 'all') return [...available];
  if (requested === 'none') return [];

  const names = requested
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  const unknown = names.filter((name) => !available.includes(name));
  if (unknown.length > 0) {
    throw new InstallError(`Unknown ${label}: ${unknown.join(', ')}`, [
      `Available: ${available.join(' ') || '(none)'}`
    ]);
  }

  return [...new Set(names)].sort();
};

const RELATIVE_LINK = /\]\(\.\.\/([A-Za-z0-9_-]+)\//g;

/**
 * Rules cross-reference each other with links like ../common/coding-style.md.
 * Report links from selected categories that point at unselected ones.
 */
export const findUnresolvedReferences = (
  rulesDir: string,
  selected: readonly string[],
  available: readonly string[]
): Reference[] => {
  const references: Reference[] = [];

  selected.forEach((category) => {
    const categoryDir = join(rulesDir, category);
    const files = getMarkdownFiles(categoryDir);

    files.forEach((file) => {
      const contents = readFile(categoryDir, file);
      if (contents === undefined) return;

      findReferences(contents).forEach((dependency) => {
        if (!available.includes(dependency)) return;
        if (selected.includes(dependency)) return;

        references.push({
          from: `rules/${category}/${file}`,
          dependency
        });
      });
    });
  });

  return references;
};

const getMarkdownFiles = (dir: string): string[] => {
  try {
    return readdirSync(dir).filter((name) => name.endsWith('.md'));
  } catch {
    return [];
  }
};

const findReferences = (contents: string): string[] => {
  const references = new Set<string>();

  [...contents.matchAll(RELATIVE_LINK)].forEach((match) => {
    const dependency = match[1];

    if (dependency !== undefined) {
      references.add(dependency);
    }
  });

  return [...references];
};

export const uniqueDependencies = (
  references: readonly Reference[]
): string[] =>
  [...new Set(references.map((reference) => reference.dependency))].sort();

export const resolveDependencies = async (
  selection: readonly string[],
  available: readonly string[],
  shouldForce: boolean,
  rulesDir: string
): Promise<string[]> => {
  const references = findUnresolvedReferences(rulesDir, selection, available);
  if (references.length === 0) return [...selection];

  const missing = uniqueDependencies(references);
  heading('Unresolved references');
  references.forEach(({ from, dependency }) => {
    info(`  ${dim(from)} -> ../${dependency}/`);
  });

  info(`\nReferenced but not selected: ${bold(missing.join(', '))}`);

  const include =
    (!isInteractive && shouldForce) || (await confirmDependencies(missing));

  if (!include) {
    warn('Continuing without them — those links will not resolve.');
    return [...selection];
  }
  return [...new Set([...selection, ...missing])].sort();
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
