/* eslint-disable @typescript-eslint/no-var-requires */
import utils from 'ts-jest/utils/index.js';
import tsconfig from './tsconfig.json' assert { type: "json" };

export const collectCoverage = true;
export const transform = {
  '^.+\\.ts$': 'ts-jest',
};
export const moduleFileExtensions = ['js', 'ts'];
export const testEnvironment = 'jsdom';
export const testMatch = ['**/*.test.ts'];
export const globals = {
  'ts-jest': {
    tsconfig: './tsconfig.json',
    diagnostics: false,
  },
};
export const moduleNameMapper = utils.pathsToModuleNameMapper(tsconfig.compilerOptions.paths, { prefix: '<rootDir>/' });

export default {
  collectCoverage,
  transform,
  moduleFileExtensions,
  testEnvironment,
  testMatch,
  globals,
  moduleNameMapper
};