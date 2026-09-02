module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    '@nuxtjs',
    'plugin:vue/essential'
  ],
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    'vue'
  ],
  ignorePatterns: ['dist/'],
  rules: {
    'no-console': 'off'
  }
}
