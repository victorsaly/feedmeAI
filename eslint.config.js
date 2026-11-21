import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'brag-output', 'worker', 'workers', 'public', 'scripts/sw.js', '.wrangler', 'ios', 'e2e/.results'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['*.{js,ts}', 'scripts/**/*.{js,mjs}', 'e2e/**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    // scripts that draw pages in a browser hand it functions that use `document`
    languageOptions: { ecmaVersion: 2022, globals: { ...globals.node, document: 'readonly' } },
  },
)
