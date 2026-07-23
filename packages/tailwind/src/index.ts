// @universe/tailwind — shared Tailwind v4 design tokens.
//
// CSS entrypoints are consumed via subpath imports, not this barrel:
//   @import "@universe/tailwind/tailwind"  → web bundle (theme + variables + base + animations)
//   @import "@universe/tailwind/native"    → React Native (uniwind) tokens
//   @import "@universe/tailwind/fonts"     → Basel Grotesk @font-face (web)
//
// This barrel exports the platform-agnostic token *type* vocabulary.
export * from './types'
