// Preloaded via `bun --preload` for the `check:deps:usage` Nx target so that
// knip's webpack-plugin scanner doesn't spam DeprecationWarnings (e.g.
// DEP_WEBPACK_JAVASCRIPT_MODULES_PLUGIN) on every run. Knip pulls in webpack
// only to parse webpack configs; the warnings come from webpack's own
// internals and are not actionable here.
process.noDeprecation = true;
