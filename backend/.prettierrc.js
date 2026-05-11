/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  arrowParens: 'avoid',
  bracketSameLine: false,
  bracketSpacing: true,
  printWidth: 100,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  semi: true,
  overrides: [
    {
      files: ['*.json', '*.md', '*.yml', '*.yaml'],
      options: {
        tabWidth: 2,
      },
    },
  ],
  organizeImportsSkipDestructiveCodeActions: true,
};

export default config;
