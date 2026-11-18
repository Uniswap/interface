// Set by the Storybook vitest plugin as a literal replacement; "false" in a story test run.
interface ImportMeta {
  readonly env: { readonly VITEST_STORYBOOK?: string }
}
