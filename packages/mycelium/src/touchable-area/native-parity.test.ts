import { describe, expect, it } from 'vitest'

/**
 * Native TouchableAreaCompat parity — written skipped, annotated INFRA-2353.
 *
 * The web harness (`packages/tailwind/src/parity/touchable-area`) proves the
 * CSS surface; the native side needs the uniwind/Metro resolved-style
 * equivalence gates from INFRA-2353 before these can execute (this package's
 * vitest environment has no react-native runtime to render `Pressable`).
 * The scenarios are pinned here so INFRA-2353 unskips instead of re-deriving.
 */
// oxlint-disable-next-line jest/no-disabled-tests, vitest/no-disabled-tests -- INFRA-2353: unskips with the native resolved-style harness
describe.skip('TouchableAreaCompat.native — Pressable semantics (INFRA-2353)', () => {
  it('dispatches onPress through Pressable with stop-propagation gating (default true)', async () => {
    const { TouchableAreaCompat } = await import('./TouchableAreaCompat.native')
    expect(TouchableAreaCompat).toBeDefined()
  })

  it('passes onLongPress un-gated (legacy wraps only the press/pressIn/pressOut trio)', async () => {
    expect.fail('INFRA-2353: needs the native render harness')
  })

  it('disabled gates the press surface and sets accessibilityState.disabled', async () => {
    expect.fail('INFRA-2353: needs the native render harness')
  })

  it('applies auto hit-slop insets when the measured frame is under the 44/48pt minimum', async () => {
    expect.fail('INFRA-2353: needs the native render harness')
  })

  it('hitSlop={null} disables touch expansion instead of falling through to auto hit-slop', async () => {
    expect.fail('INFRA-2353: needs the native render harness')
  })

  it('shouldConsiderMinimumDimensions pins the 40pt native minimum after layout', async () => {
    expect.fail('INFRA-2353: needs the native render harness')
  })

  it('press feedback applies scaleTo/activeOpacity while pressed', async () => {
    expect.fail('INFRA-2353: needs the native render harness')
  })

  it('resolved styles match the web parity matrix per uniwind (full native style parity)', async () => {
    expect.fail('INFRA-2353: uniwind/Metro resolved-style equivalence gates')
  })
})
