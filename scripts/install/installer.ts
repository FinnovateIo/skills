import { join } from 'node:path';
import { parseOptions, USAGE } from './cli.ts';
import { cyan, dim, heading, info, InstallError } from './ui.ts';
import {
  resolveConflicts,
  resolveDependencies,
  resolveSelection
} from './inventory.ts';
import { resolveTarget } from './target.ts';
import { checkPathIsWritable, listImmediateDirectories } from './fileSystem.ts';
import { buildPlan, countByStatus, executePlan, type Group } from './plan.ts';

export const runInstaller = async (
  root: string,
  rulesPath: string,
  skillsPath: string
): Promise<void> => {
  const options = parseOptions();

  if (options.help) {
    info(USAGE);
    return;
  }

  const availableRules = listImmediateDirectories(rulesPath);
  const availableSkills = listImmediateDirectories(skillsPath);

  if (availableRules.length === 0 && availableSkills.length === 0) {
    throw new InstallError(
      `Nothing to install: no rules/ or skills/ in ${root}`
    );
  }

  if (options.list) {
    heading('Rules');
    info(availableRules.map((name) => `\t${name}`).join('\n') || '\t(none)');
    heading('Skills');
    info(availableSkills.map((name) => `\t${name}`).join('\n') || '\t(none)');
    info('');
    return;
  }

  const selectedSkills = resolveSelection(
    options.skills,
    availableSkills,
    'skill'
  );

  let selectedRules = resolveSelection(options.rules, availableRules, 'rule');
  if (selectedRules.length === 0 && selectedSkills.length === 0) {
    throw new InstallError('Nothing selected to install.');
  }

  const target = await resolveTarget(options);
  const isTargetWritable = checkPathIsWritable(target);
  if (!isTargetWritable) {
    throw new InstallError(
      `Cannot write to ${target}. Check permissions and try again.`
    );
  }

  selectedRules = await resolveDependencies(
    selectedRules,
    availableRules,
    options.force,
    rulesPath
  );

  const groups: Group[] = [
    ...selectedRules.map((name) => ({
      sourceRoot: join(rulesPath, name),
      destRoot: join(target, 'rules', name),
      prefix: join('rules', name)
    })),
    ...selectedSkills.map((name) => ({
      sourceRoot: join(skillsPath, name),
      destRoot: join(target, 'skills', name),
      prefix: join('skills', name)
    }))
  ];

  const planned = buildPlan(groups, target);
  if (planned.length === 0)
    throw new InstallError('No files matched the selection.');

  const totals = countByStatus(planned);
  heading(`Installing to ${target}`);
  if (options['dry-run']) info(dim('mode: dry run, nothing will be written'));
  info(`\t${selectedRules.length} rules: ${selectedRules.join(' ') || '-'}`);
  info(`\t${selectedSkills.length} skills: ${selectedSkills.join(' ') || '-'}`);
  info(
    `\t${planned.length} files — ${totals.new} new, ${totals.unchanged} unchanged, ${totals.conflict} conflicting`
  );

  const resolved = await resolveConflicts(planned, options.force);
  const { installed, skipped } = executePlan(resolved, options['dry-run']);

  if (options['dry-run']) {
    heading('Dry run complete');
    info(`\t${installed} would be written, ${skipped} would be left untouched`);
  } else {
    heading('Done');
    info(`\t${installed} installed, ${skipped} left untouched`);
  }
  info(`\t${cyan(target)}`);
  info('');
};
