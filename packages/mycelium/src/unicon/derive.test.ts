/**
 * INFRA-3516: pins the shared input → avatar derivation both platform legs
 * render from, in both modes:
 *
 * - Address mode: inputs the retired ui/src Unicon accepted derive EXACTLY like
 *   it did (keccak256 of the normalized address, 40-bit slice, plain Number
 *   modulo) — the golden indices below were computed through that component's
 *   own code path, so every wallet keeps its avatar.
 * - Backup mode: every other input keeps the original mycelium cyrb53
 *   derivation, so non-address avatars (usernames, emails, API-key seeds) are
 *   unchanged by the convergence.
 *
 * The literal pins are regression guards — changing either hash, COLOR_COUNT,
 * or the icon key set silently reassigns avatars on every platform at once.
 */
import { describe, expect, it } from 'vitest'
import { COLOR_COUNT, UNICON_COLORS } from './colors'
import { deriveUnicon, getUniconColor, GLYPH_VIEWBOX_SIZE, uniconGeometry } from './derive'
import { hashString } from './hash'
import { Icons } from './icons'

// Golden fixtures for ADDRESS inputs: expected values computed via the retired
// ui/src Unicon's derivation.
const LEGACY_PARITY_GOLDEN = [
  { input: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', hash: 129186966422n, colorIndex: 2, iconKey: '40' },
  { input: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', hash: 102528831323n, colorIndex: 3, iconKey: '47' },
  { input: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', hash: 309666814005n, colorIndex: 5, iconKey: '57' },
  { input: '0xE592427A0AEce92De3Edee1F18E0157C05861564', hash: 922969835489n, colorIndex: 9, iconKey: '34' },
  { input: '0x000000000022D473030F116dDEE9F6B43aC78BA3', hash: 356773702342n, colorIndex: 2, iconKey: '66' },
  { input: '0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af', hash: 907907196444n, colorIndex: 4, iconKey: '13' },
  // SVM addresses hash un-normalized, exactly like legacy.
  { input: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK', hash: 910586450119n, colorIndex: 9, iconKey: '69' },
] as const

// Golden fixtures for BACKUP inputs (cyrb53 — unchanged from pre-convergence
// mycelium): anything legacy would reject, including a bad-checksum EVM
// address (legacy renders null for it; mycelium still renders an avatar).
const BACKUP_GOLDEN = [
  { input: 'user@example.com', hash: 10480051118383854456n, colorIndex: 6, iconKey: '60' },
  { input: 'hello.uni.eth', hash: 5581000382802621218n, colorIndex: 8, iconKey: '58' },
  { input: 'dev-portal-api-key', hash: 9431677590086297370n, colorIndex: 0, iconKey: '19' },
  { input: '0xE1b1e2a97ceA3A6EbA8FdcD4E27CC3EFbfd4B44b', hash: 8468618076518649764n, colorIndex: 4, iconKey: '31' },
] as const

describe('deriveUnicon — address mode (legacy parity)', () => {
  it.each(LEGACY_PARITY_GOLDEN)(
    'derives $input exactly like legacy ui/src Unicon',
    ({ input, hash, colorIndex, iconKey }) => {
      const derivation = deriveUnicon(input)
      expect(derivation.colorIndex).toBe(colorIndex)
      expect(derivation.paths).toBe(Icons[iconKey])
      // The pinned 40-bit legacy hash implies both indices (legacy's plain
      // Number modulo) — assert the implication holds so a golden-table typo
      // cannot pass silently.
      expect(colorIndex).toBe(Number(hash) % COLOR_COUNT)
      expect(Icons[iconKey]).toBe(Object.values(Icons)[Number(hash) % Object.keys(Icons).length])
    },
  )

  it('normalizes a lowercase EVM address to its checksummed form first, like legacy getAddress()', () => {
    const lowercase = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
    const checksummed = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    expect(deriveUnicon(lowercase)).toEqual(deriveUnicon(checksummed))
  })
})

describe('deriveUnicon — backup mode (cyrb53, unchanged by convergence)', () => {
  it.each(BACKUP_GOLDEN)('derives $input from the cyrb53 hash', ({ input, hash, colorIndex, iconKey }) => {
    expect(hashString(input)).toBe(hash)
    const derivation = deriveUnicon(input)
    expect(derivation.colorIndex).toBe(colorIndex)
    expect(derivation.paths).toBe(Icons[iconKey])
  })

  it('falls to the backup (not a render-time throw) when the predicate and viem disagree — ICAP forms', () => {
    // Reachable today: ethers-based isEVMAddressWithChecksum accepts ICAP
    // `XE…` addresses, viem's getAddress throws InvalidAddressError on them.
    const icap = 'XE65GB6LDNXYOFTX0NSV3FUWKOWIXAMJK36'
    const derivation = deriveUnicon(icap)
    const hash = hashString(icap)
    expect(derivation.colorIndex).toBe(Number(hash % BigInt(COLOR_COUNT)))
    expect(derivation.paths).toBe(Object.values(Icons)[Number(hash % BigInt(Object.keys(Icons).length))])
  })

  it('is deterministic and hits only valid palette/glyph slots', () => {
    const inputs = ['', '0xabc', 'someone', '🦄', 'a'.repeat(500)]
    for (const input of inputs) {
      const first = deriveUnicon(input)
      expect(deriveUnicon(input)).toEqual(first)
      expect(first.colorIndex).toBeGreaterThanOrEqual(0)
      expect(first.colorIndex).toBeLessThan(COLOR_COUNT)
      expect(Object.values(Icons)).toContain(first.paths)
      expect(first.paths.length).toBeGreaterThan(0)
    }
  })

  it('uses BigInt modulo (cyrb53 hashes exceed Number.MAX_SAFE_INTEGER; the 40-bit legacy hash does not)', () => {
    expect(hashString('user@example.com') > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true)
  })
})

describe('getUniconColor', () => {
  it('returns the palette slot deriveUnicon picks, per theme', () => {
    // colorIndex 2 in the address goldens above
    expect(getUniconColor('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', false)).toBe('#FF8934')
    expect(getUniconColor('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', true)).toBe('#FF4D00')
  })

  it('covers non-address inputs through the backup derivation', () => {
    const { colorIndex } = deriveUnicon('someone')
    expect(getUniconColor('someone', false)).toBe(UNICON_COLORS.light[colorIndex])
  })
})

describe('uniconGeometry', () => {
  it('pins the default layout math to legacy (glyph at size/48/1.5, no extra shrink)', () => {
    const geometry = uniconGeometry({ size: 48 })
    expect(geometry.scale).toBeCloseTo(1 / 1.5, 10)
    expect(geometry.translate).toBeCloseTo((48 - 48 / 1.5) / 2, 10)
    expect(geometry.iconSize).toBe(Math.round(48 * 0.4))
    expect(geometry.iconOffset).toBeCloseTo((48 - geometry.iconSize) / 2, 10)
  })

  it('pins the bare layout math (glyph fills the container)', () => {
    const geometry = uniconGeometry({ size: 32, bare: true })
    expect(geometry.scale).toBeCloseTo(32 / GLYPH_VIEWBOX_SIZE, 10)
    expect(geometry.translate).toBeCloseTo(0, 10)
  })
})
