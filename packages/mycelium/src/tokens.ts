/**
 * Token-constants compat for the Tamagui→Tailwind migration — the public
 * `@universe/mycelium/tokens` surface.
 *
 * A barrel over two pieces: ./token-constants.ts holds every
 * platform-invariant family, and `fonts` is a three-leg platform split because
 * native applies a +1px ramp and names the real React Native font family —
 * see ./font-tokens.ts. Keeping the invariant families in a leaf lets
 * in-package modules (./compat/tokens.ts) read them without pulling in the
 * split's module graph.
 *
 * Tests: font-tokens.platform-legs.test.ts (leg shape and table assembly) and
 * text-compat/native-font.test.ts (the native ramp values).
 */
export { fonts } from './font-tokens'
export * from './token-constants'
