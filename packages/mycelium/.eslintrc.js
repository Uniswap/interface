module.exports = {
  extends: ['@uniswap/eslint-config/lib'],
  parserOptions: {
    tsconfigRootDir: __dirname,
  },
  // Note: no-relative-import-paths is disabled for mycelium because
  // this package uses `exports` in package.json (required for ./tailwind CSS export).
  // Packages with `exports` cannot use absolute internal imports like
  // '@universe/mycelium/src/types' since they're blocked by the exports restriction.
}
