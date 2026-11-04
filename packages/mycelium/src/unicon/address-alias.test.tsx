/**
 * INFRA-3476: `address` is a compat alias for `input` on the Unicon prop
 * surface — the legacy `ui/src` Unicon prop name, so converted call sites can
 * swap mechanically. This suite proves the alias EQUIVALENT (byte-identical
 * rendered output on both platform legs, resolved through the same shared
 * `derive.ts` the legacy-parity goldens pin).
 *
 * It also pins the one deliberate divergence from legacy: for an address
 * legacy REJECTS, legacy renders null while mycelium renders the backup
 * avatar (cyrb53 path). That behavior is unchanged here on purpose — the
 * null-vs-backup ruling is pending with Charlie, and INFRA-3476 is the
 * removal condition for the pin below.
 */
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { describe, expect, it, vi } from 'vitest'
import { deriveUnicon, resolveUniconInput } from './derive'
import type { UniconProps } from './types'
import * as web from './Unicon.web'

// Same jsdom stand-ins as platform-legs.test.tsx: the native leg imports
// react-native, react-native-svg, and uniwind, none of which load here.
vi.mock('react-native', () => import('./testing/react-native-mock'))
vi.mock('react-native-svg', () => import('./testing/react-native-svg-mock'))
vi.mock('uniwind', () => import('./testing/uniwind-mock'))

// react-test-renderer's act() needs the explicit opt-in (floating-overlay precedent).
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// Every input class legacy accepts: checksummed EVM, lowercase EVM (legacy
// checksum-normalizes before hashing), base58 SVM.
const LEGACY_ACCEPTED_ADDRESSES = [
  '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
  'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
] as const

// An input legacy rejects (bad checksum), so it renders null there.
const LEGACY_REJECTED_ADDRESS = '0xE1b1e2a97ceA3A6EbA8FdcD4E27CC3EFbfd4B44b'

describe('resolveUniconInput', () => {
  it('resolves whichever identity prop was passed', () => {
    expect(resolveUniconInput({ input: 'user@example.com' })).toBe('user@example.com')
    expect(resolveUniconInput({ address: LEGACY_ACCEPTED_ADDRESSES[0] })).toBe(LEGACY_ACCEPTED_ADDRESSES[0])
  })

  it('the prop surface requires exactly one of input/address (compile-time XOR)', () => {
    // @ts-expect-error -- passing both identity props must be rejected
    const both: UniconProps = { input: 'x', address: 'y' }
    // @ts-expect-error -- passing neither identity prop must be rejected
    const neither: UniconProps = { size: 32 }
    expect(both).toBeTruthy()
    expect(neither).toBeTruthy()
  })
})

describe('web leg: address renders identically to input', () => {
  it.each([...LEGACY_ACCEPTED_ADDRESSES, LEGACY_REJECTED_ADDRESS])('%s', (address) => {
    const viaInput = render(<web.Unicon input={address} size={32} />)
    const viaAddress = render(<web.Unicon address={address} size={32} />)
    expect(viaAddress.container.innerHTML).toBe(viaInput.container.innerHTML)
    expect(viaAddress.container.innerHTML).toContain('<svg')
  })

  it('address flows through the shared derive.ts (color slot + glyph paths)', () => {
    const address = LEGACY_ACCEPTED_ADDRESSES[0]
    const { colorIndex, paths } = deriveUnicon(address)
    const { container } = render(<web.Unicon address={address} size={32} />)
    expect(container.querySelector('circle')?.getAttribute('fill')).toBe(`var(--unicon-${colorIndex})`)
    const drawn = Array.from(container.querySelectorAll('path')).map((path) => path.getAttribute('d'))
    expect(drawn).toEqual(paths)
  })

  it('DIVERGENCE PIN: an address legacy rejects renders the backup avatar, not null', () => {
    // Legacy ui/src Unicon renders null for this input; mycelium deliberately
    // keeps rendering the cyrb53 backup avatar. Pending ruling with Charlie —
    // INFRA-3476 is the removal condition for this pin.
    const { colorIndex, paths } = deriveUnicon(LEGACY_REJECTED_ADDRESS)
    const { container } = render(<web.Unicon address={LEGACY_REJECTED_ADDRESS} size={32} />)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.querySelector('circle')?.getAttribute('fill')).toBe(`var(--unicon-${colorIndex})`)
    const drawn = Array.from(container.querySelectorAll('path')).map((path) => path.getAttribute('d'))
    expect(drawn).toEqual(paths)
    expect(drawn.length).toBeGreaterThan(0)
  })
})

describe('native leg: address renders identically to input', () => {
  function renderNativeTree(ui: ReactElement): ReactTestRenderer {
    let renderer: ReactTestRenderer | undefined
    act(() => {
      renderer = create(ui)
    })
    if (!renderer) {
      throw new Error('render produced no tree')
    }
    return renderer
  }

  it.each([...LEGACY_ACCEPTED_ADDRESSES, LEGACY_REJECTED_ADDRESS])('%s', async (address) => {
    const native = await import('./Unicon.native')
    const uniwind = await import('./testing/uniwind-mock')
    const { colorIndex } = deriveUnicon(address)
    uniwind.__setCSSVariables({
      [`--unicon-${colorIndex}`]: '#0C8911',
      '--unicon-bg-opacity': 0.12,
    })
    const viaInput = renderNativeTree(<native.Unicon input={address} size={32} />)
    const viaAddress = renderNativeTree(<native.Unicon address={address} size={32} />)
    expect(viaAddress.toJSON()).toEqual(viaInput.toJSON())
    // Both trees actually drew the avatar (not two empty trees agreeing).
    expect(viaAddress.root.findAllByType('Svg.Path' as never).length).toBeGreaterThan(0)
    act(() => viaInput.unmount())
    act(() => viaAddress.unmount())
    uniwind.__resetCSSVariables()
  })
})
