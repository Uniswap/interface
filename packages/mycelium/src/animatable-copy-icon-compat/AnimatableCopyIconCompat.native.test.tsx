/**
 * Render contract for the NATIVE leg of the `AnimatableCopyIcon` compat
 * (react-test-renderer + the modal-close-icon svg mock, the
 * `Unicon.native.test.tsx` pattern). The export-parity suite only proves the
 * leg imports; this proves it mounts — in particular that
 * `resolveCopyIconColor` finds every `$`-token it is handed in the spore map
 * (a miss throws, which on device is a hard render crash). This config
 * resolves `.web.*` first, so the `CopySheets` icon mounts through the web
 * icon factory (a DOM `svg`); the native leg's own wiring is what's under test.
 */
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { describe, expect, it, vi } from 'vitest'
import { LIGHT_THEME_COLORS } from '../theme-hooks-compat/tokens'

// The native leg imports react-native-svg, whose real CJS build requires
// react-native's flow sources; the real module is exercised on device, not
// under this jsdom config.
vi.mock('react-native-svg', () => import('../modal-close-icon/testing/react-native-svg-mock'))

// react-test-renderer's act() needs the explicit opt-in (floating-overlay precedent).
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

async function renderNativeLeg(props: { textColor?: string; dataTestId?: string }): Promise<ReactTestRenderer> {
  const { AnimatableCopyIconCompat } = await import('./AnimatableCopyIconCompat.native')
  let renderer: ReactTestRenderer | undefined
  act(() => {
    renderer = create(<AnimatableCopyIconCompat isCopied={false} size={16} {...props} />)
  })
  if (!renderer) {
    throw new Error('render produced no tree')
  }
  return renderer
}

describe('AnimatableCopyIconCompat (native) render', () => {
  it('mounts the CopySheets glyph with the default $neutral2 resolved through the spore map (no throw)', async () => {
    const renderer = await renderNativeLeg({ dataTestId: 'copy-icon' })
    const svg = renderer.root.findByType('svg' as never)
    expect(svg.props['viewBox']).toBe('0 0 24 24')
    expect(svg.props['data-testid']).toBe('copy-icon')
    expect(renderer.root.findByType('path' as never).props['fill']).toBe('currentColor')
    // A missing $neutral2 entry would have thrown above; pin the literal too.
    expect(svg.props['style']).toMatchObject({ color: LIGHT_THEME_COLORS.neutral2 })
    act(() => renderer.unmount())
  })

  it('resolves an explicit $-token textColor to its theme literal', async () => {
    const renderer = await renderNativeLeg({ textColor: '$statusSuccess' })
    const svg = renderer.root.findByType('svg' as never)
    expect(svg.props['style']).toMatchObject({ color: LIGHT_THEME_COLORS.statusSuccess })
    act(() => renderer.unmount())
  })
})
