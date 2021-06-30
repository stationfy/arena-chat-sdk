import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import json from 'rollup-plugin-json';

const terserInstance = terser({
  mangle: {
    properties: {
      regex: /^_[^_]/,
    },
  },
});

const plugins = [
  replace({
    'firebase.initializeApp': 'firebase.default.initializeApp',
    preventAssignment: true
  }),
  typescript({
    tsconfig: 'tsconfig.build.json',
    tsconfigOverride: {
      compilerOptions: {
        declaration: false,
        declarationMap: false,
        module: 'ESNext',
      },
    },
    include: ['*.ts+(|x)', '**/*.ts+(|x)', '../**/*.ts+(|x)'],
  }),
  resolve({
    mainFields: ['module'],
    preferBuiltins: true,
    browser: true
  }),
  commonjs(),
  json(),
];

const bundleConfig = {
  input: 'src/index.ts',
  output: {
    format: 'iife',
    name: 'ArenaChat',
    sourcemap: true,
    strict: false,
  },
  inlineDynamicImports: true,
  context: 'window',
  plugins: [...plugins],
};

export default [
  // ES5 Browser Bundle
  {
    ...bundleConfig,
    output: {
      ...bundleConfig.output,
      file: 'build/bundle.js',
    },
  },
  {
    ...bundleConfig,
    output: {
      ...bundleConfig.output,
      file: 'build/bundle.min.js',
      sourcemap: false,
    },
    plugins: bundleConfig.plugins.concat(terserInstance),
  },
];
