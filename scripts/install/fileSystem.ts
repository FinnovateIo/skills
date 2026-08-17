import {
  accessSync,
  constants,
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  readlinkSync
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';

const IGNORED = new Set(['.DS_Store']);

export const listFilesForDir = (dir: string): string[] => {
  return readdirSync(dir, {
    recursive: true,
    withFileTypes: true
  })
    .filter((entry) => entry.isFile() && !IGNORED.has(entry.name))
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)))
    .sort();
};

export const checkFilesHaveSameContents = (
  fileA: string,
  fileB: string
): boolean => {
  try {
    return readFileSync(fileA).equals(readFileSync(fileB));
  } catch {
    return false;
  }
};

export const checkSymLinkToTarget = (
  filePath: string,
  targetFilePath: string
): boolean => {
  try {
    return (
      lstatSync(filePath).isSymbolicLink() &&
      readlinkSync(filePath) === targetFilePath
    );
  } catch {
    return false;
  }
};

export const checkFileExists = (filePath: string): boolean => {
  try {
    lstatSync(filePath);
    return true;
  } catch {
    return false;
  }
};

export const expandPath = (path: string) =>
  path.startsWith('~/') ? join(homedir(), path.slice(2)) : resolve(path);

// Given a target destination, if it does not exist, find its nearest ancestor and check for write permissions
export const checkPathIsWritable = (targetPath: string) => {
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
    return true;
  } catch {
    return false;
  }
};
