import { fireEvent, render } from '@testing-library/react'
/**
 * Platform-leg contract for the hand-written icons' splits under `internal/`
 * (`os-cloud-glyph`, `close-icon-frame`, `unitag-image`), following
 * `platform-legs.test.tsx`. This jsdom config resolves `.web.*` first, so the
 * base and native legs are imported by explicit specifier with their
 * react-native-only dependencies mocked; on-device rendering is not covered here.
 */
import { PlatformSplitStubError } from '@universe/environment'
import { createElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as baseCloseFrame from '../internal/close-icon-frame.tsx'
import * as baseCloud from '../internal/os-cloud-glyph.tsx'
import * as baseUnitag from '../internal/unitag-image.tsx'
import { Unitag } from '../Unitag'

const platform = vi.hoisted(() => ({ OS: 'ios' }))
const theme = vi.hoisted(() => ({ isDark: false }))

vi.mock('react-native', () => ({ Platform: platform, I18nManager: { isRTL: false } }))
vi.mock('../../../touchable-area/TouchableAreaCompat', () => ({
  TouchableAreaCompat: ({
    role,
    testID,
    onPress,
    children,
  }: {
    role: string
    testID?: string
    onPress: () => void
    children: ReactNode
  }) => createElement('button', { role, 'data-testid': testID, onClick: onPress }, children),
}))
vi.mock('../../../universal-image', () => ({
  UniversalImage: ({ uri, size }: { uri: string; size: { width: number; height: number } }) =>
    createElement('rn-image', { 'data-uri': uri, 'data-width': size.width, 'data-height': size.height }),
}))
vi.mock('../../../theme-hooks-compat/useIsDarkMode', () => ({ useIsDarkMode: () => theme.isDark }))
// The colour is asserted on the X the frame hands it: jsdom drops `var()` from typed inline styles.
vi.mock('../X', () => ({
  X: ({ color }: { color?: string }) => createElement('span', { 'data-testid': 'x', 'data-color': color }),
}))
vi.mock('../../../assets', () => ({
  UNITAG_DARK: 'unitag-dark.png',
  UNITAG_LIGHT: 'unitag-light.png',
  UNITAG_DARK_SMALL: 'unitag-dark-small.png',
  UNITAG_LIGHT_SMALL: 'unitag-light-small.png',
}))

afterEach(() => {
  platform.OS = 'ios'
  theme.isDark = false
  vi.resetModules()
})

describe('export parity across the legs', () => {
  it.each([
    ['os-cloud-glyph', baseCloud, () => import('../internal/os-cloud-glyph.native'), ['OSCloudGlyph']],
    ['close-icon-frame', baseCloseFrame, () => import('../internal/close-icon-frame.native'), ['CloseIconFrame']],
    ['unitag-image', baseUnitag, () => import('../internal/unitag-image.native'), ['UnitagImage']],
  ] as const)('%s: the native leg exports exactly the base leg symbol set', async (_name, base, loadNative, keys) => {
    const native = await loadNative()
    expect(Object.keys(native).sort()).toEqual(Object.keys(base).sort())
    expect(Object.keys(base).sort()).toEqual([...keys].sort())
  })

  it('each base leg throws PlatformSplitStubError instead of rendering', () => {
    const glyph = baseCloud.OSCloudGlyph as unknown as { render: (props: object, ref: null) => unknown }
    expect(() => glyph.render({}, null)).toThrow(PlatformSplitStubError)
    expect(() => baseCloseFrame.CloseIconFrame({ onClose: vi.fn() })).toThrow(PlatformSplitStubError)
    expect(() => baseUnitag.UnitagImage({ size: 16 })).toThrow(PlatformSplitStubError)
  })
})

describe('os-cloud-glyph', () => {
  it('web renders GoogleDrive', async () => {
    expect((await import('../internal/os-cloud-glyph.web')).OSCloudGlyph).toBe(
      (await import('../GoogleDrive')).GoogleDrive,
    )
  })

  it('native renders Cloud on iOS and GoogleDrive on Android', async () => {
    expect((await import('../internal/os-cloud-glyph.native')).OSCloudGlyph).toBe((await import('../Cloud')).Cloud)
    vi.resetModules()
    platform.OS = 'android'
    expect((await import('../internal/os-cloud-glyph.native')).OSCloudGlyph).toBe(
      (await import('../GoogleDrive')).GoogleDrive,
    )
  })
})

describe('close-icon-frame native leg', () => {
  it('presses through a TouchableArea and defaults to the $neutral2 token', async () => {
    const { CloseIconFrame } = await import('../internal/close-icon-frame.native')
    const onClose = vi.fn()
    const { getByTestId, rerender } = render(<CloseIconFrame role="button" testId="close" onClose={onClose} />)
    fireEvent.click(getByTestId('close'))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(getByTestId('x').getAttribute('data-color')).toBe('$neutral2')

    rerender(<CloseIconFrame color="red" role="button" testId="close" onClose={onClose} />)
    expect(getByTestId('x').getAttribute('data-color')).toBe('red')
  })
})

describe('unitag-image native leg', () => {
  it('renders the full-size asset for the active theme at a numeric size', async () => {
    const { UnitagImage } = await import('../internal/unitag-image.native')
    const { container, rerender } = render(<UnitagImage size="16" />)
    const image = (): Element | null => container.querySelector('rn-image')
    expect(image()?.getAttribute('data-uri')).toBe('unitag-light.png')
    expect(image()?.getAttribute('data-width')).toBe('16')
    theme.isDark = true
    rerender(<UnitagImage size={20} />)
    expect(image()?.getAttribute('data-uri')).toBe('unitag-dark.png')
    expect(image()?.getAttribute('data-height')).toBe('20')
  })
})

describe('Unitag size tokens', () => {
  it('resolves an $icon size token to px before rendering', () => {
    const { container } = render(<Unitag size="$icon.16" />)
    expect(container.querySelector('img')?.getAttribute('width')).toBe('16')
  })
})
