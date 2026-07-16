import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

const yamlBlockFor = (source: string, key: string, indentation: number) => {
  const lines = source.split('\n');
  const prefix = ' '.repeat(indentation);
  const start = lines.findIndex((line) => line === `${prefix}${key}:`);
  if (start < 0) return undefined;

  let end = start + 1;
  while (end < lines.length) {
    const line = lines[end];
    if (line.trim() && line.length - line.trimStart().length <= indentation) break;
    end += 1;
  }
  return lines.slice(start, end).join('\n');
};

const permissionEntriesFor = (jobBlock: string) => {
  const permissionBlock = yamlBlockFor(jobBlock, 'permissions', 4);
  if (!permissionBlock) return [];
  return permissionBlock
    .split('\n')
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => line.trim());
};

test('Playwright builds and serves a freshly managed production preview', () => {
  const config = readFileSync(resolve('playwright.config.ts'), 'utf8');

  expect(config).toContain(
    "command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4321'",
  );
  expect(config).toContain("url: 'http://127.0.0.1:4321'");
  expect(config).toContain('reuseExistingServer: false');
  expect(config).not.toMatch(/command:\s*['"][^'"]*\bdev\b/);
});

test('deployment workflow grants only job-scoped least privileges', () => {
  const workflow = readFileSync(resolve('.github/workflows/deploy.yml'), 'utf8');
  const buildJob = yamlBlockFor(workflow, 'build', 2);
  const deployJob = yamlBlockFor(workflow, 'deploy', 2);

  expect(workflow).not.toMatch(/^permissions:/m);
  expect(buildJob).toBeDefined();
  expect(deployJob).toBeDefined();
  expect(permissionEntriesFor(buildJob!)).toEqual(['contents: read']);
  expect(permissionEntriesFor(deployJob!)).toEqual(['pages: write', 'id-token: write']);
  expect(buildJob).toContain('node-version: 24');
});

test('private proposal has one exact ignore rule and remains local', () => {
  const proposalFilename = '402_I_Can_t_Believe_It_s_Not_B.pdf';
  const ignoreLines = readFileSync(resolve('.gitignore'), 'utf8').split(/\r?\n/);

  expect(ignoreLines.filter((line) => line === proposalFilename)).toHaveLength(1);
  expect(existsSync(resolve(proposalFilename))).toBe(true);
});

test('private package metadata is explicit in the manifest and lockfile root', () => {
  const manifest = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
  const lockfile = JSON.parse(readFileSync(resolve('package-lock.json'), 'utf8'));

  expect(manifest.description).toBe('Official website for the ICBINBio NeurIPS 2026 workshop.');
  expect(manifest.license).toBe('UNLICENSED');
  expect(lockfile.packages[''].license).toBe('UNLICENSED');
});
