import chalk, { chalkStderr } from 'chalk';

export const { bold, dim, green, yellow, cyan } = chalk;
export const info = (text: string) => console.log(text);
export const warn = (text: string) => console.error(chalkStderr.yellow(text));
export const heading = (text: string) => console.log(`\n${bold(text)}`);

export class InstallError extends Error {
  details: string[];

  constructor(message: string, details: string[] = []) {
    super(message);
    this.name = 'InstallError';
    this.details = details;
  }
}
