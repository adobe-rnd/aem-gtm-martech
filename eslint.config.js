import globals from 'globals';
import { defineConfig, globalIgnores } from '@eslint/config-helpers';
import { recommended, source, test } from '@adobe/eslint-config-helix';

export default defineConfig([
  globalIgnores([
    '.vscode/*',
    'coverage/*',
    'dist/*',
  ]),
  {
    extends: [recommended],
  },
  source,
  test,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'max-len': ['error', { code: 140 }],
    },
  },
]);