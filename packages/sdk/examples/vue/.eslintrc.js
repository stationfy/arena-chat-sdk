module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    amd: true,
  },
  'extends': [
    "plugin:vue/essential",
    "eslint:recommended",
    "@vue/prettier"
  ],
  "parser": "vue-eslint-parser",
  "parserOptions": {
    "parser": "babel-eslint",
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "plugins": [
    "vue",
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      env: {
        jest: true
      }
    }
  ]
};
