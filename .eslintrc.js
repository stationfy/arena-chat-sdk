module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    browser: true,
    amd: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier/@typescript-eslint'],
  rules: {
    '@typescript-eslint/ban-ts-comment': 'off',
  },
};
