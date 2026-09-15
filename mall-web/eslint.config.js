import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

// ESLint 9 flat config：vue3-recommended + typescript-eslint 官方配套
// 约束：核心规则不得关闭；样式类规则如与 Prettier 冲突按需调整为 warn
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', '*.d.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      // SFC <script lang="ts"> 由 vue-tsc 承担未定义符号检查（含 DOM lib 全局），
      // 核心 no-undef 不识别 TS/DOM 声明，按 typescript-eslint 官方建议关闭
      'no-undef': 'off',
    },
  },
  {
    rules: {
      // 与 Prettier 职责重叠的模板样式规则降为 warn（不关闭核心规则）
      'vue/max-attributes-per-line': 'warn',
      'vue/singleline-html-element-content-newline': 'warn',
      'vue/multiline-html-element-content-newline': 'warn',
      'vue/html-self-closing': 'warn',
      'vue/html-indent': 'warn',
      'vue/html-quotes': 'warn',
      'vue/attribute-hyphenation': 'warn',
    },
  },
)
