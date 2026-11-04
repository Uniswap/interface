import { isEVMAddressWithChecksum } from 'utilities/src/addresses/evm/evm'
import { isSVMAddress } from 'utilities/src/addresses/svm/svm'
// viem backs the address hash only: it keeps every wallet's avatar identical to
// the one the retired ui/src Unicon drew.
import { getAddress, keccak256, stringToBytes } from 'viem'
import { COLOR_COUNT, UNICON_COLORS } from './colors'
import { hashString } from './hash'
import { type IconPaths, Icons } from './icons'
import type { UniconIdentityProps } from './types'

/**
 * The avatar-identity string regardless of which prop spelled it: `address`
 * is the legacy `ui/src` prop name aliasing `input` (INFRA-3476). Shared by
 * both platform legs so the alias resolves once, in front of `deriveUnicon`.
 */
export function resolveUniconInput(identity: UniconIdentityProps): string {
  return identity.input ?? identity.address
}

/** Edge length of the viewBox the glyph paths in `icons.ts` are drawn on. */
export const GLYPH_VIEWBOX_SIZE = 48

/**
 * Input-derived avatar identity. Shared by both platform legs so the same
 * input renders the same avatar on web and native (INFRA-3516 parity).
 */
export interface UniconDerivation {
  /** Index into the 10-slot unicon palette (`--unicon-N` / `UNICON_COLORS`). */
  colorIndex: number
  /** SVG path `d` strings of the derived glyph, on the 48px viewBox. */
  paths: IconPaths
}

/**
 * Legacy-parity hash for wallet addresses: keccak256 of the EIP-55
 * normalized (EVM) or raw base58 (SVM) address, first 10 hex chars as a
 * 40-bit integer — byte-for-byte the derivation of the retired `ui/src`
 * Unicon, so an address keeps the avatar it had there.
 *
 * Returns undefined for anything the legacy component rejects (it renders
 * null there); those inputs take the cyrb53 backup path instead.
 */
function addressHash(input: string): bigint | undefined {
  const isEVMAddress = isEVMAddressWithChecksum(input)
  if (!isEVMAddress && !isSVMAddress(input)) {
    return undefined
  }
  try {
    const normalized = isEVMAddress ? getAddress(input) : input
    return BigInt(`0x${keccak256(stringToBytes(normalized)).slice(2, 12)}`)
  } catch {
    // The validation predicate (ethers-based) and viem's getAddress have
    // different accept-sets — ICAP `XE…` forms pass the predicate but throw
    // InvalidAddressError here. A disagreement must fall to the cyrb53
    // backup, never throw at render time (this ticket's whole failure class).
    return undefined
  }
}

/**
 * Derives the avatar identity from the input string.
 *
 * Wallet addresses (any input legacy `ui/src` Unicon accepts: checksummed or
 * lowercase EVM, base58 SVM) derive exactly like the legacy component —
 * keccak-based hash, plain Number modulo (safe: the hash is 40-bit; legacy's
 * `Math.abs` is a no-op on it and is not replicated).
 *
 * Every other input (usernames, emails, API-key seeds, malformed-checksum
 * addresses) keeps the original mycelium derivation — cyrb53 hash with BigInt
 * modulo (that hash exceeds Number.MAX_SAFE_INTEGER) — so non-address avatars
 * are unchanged by the convergence.
 */
export function deriveUnicon(input: string): UniconDerivation {
  // The icon map's declaration order is part of the avatar-identity contract:
  // reordering (or renaming) keys reassigns every glyph. The goldens guard it.
  const iconKeys = Object.keys(Icons)
  const legacyHash = addressHash(input)

  if (legacyHash !== undefined) {
    const colorIndex = Number(legacyHash) % COLOR_COUNT
    const iconIndex = Number(legacyHash) % iconKeys.length
    return {
      colorIndex,
      paths: Icons[iconKeys[iconIndex] as keyof typeof Icons] as IconPaths,
    }
  }

  const hash = hashString(input)
  const colorIndex = Number(hash % BigInt(COLOR_COUNT))
  const iconIndex = Number(hash % BigInt(iconKeys.length))
  return {
    colorIndex,
    paths: Icons[iconKeys[iconIndex] as keyof typeof Icons] as IconPaths,
  }
}

/**
 * The avatar's palette colour as a literal hex, for callers that tint other UI
 * from it (profile gradients, address colours) rather than rendering the avatar.
 */
export function getUniconColor(input: string, isDarkMode: boolean): string {
  const palette = isDarkMode ? UNICON_COLORS.dark : UNICON_COLORS.light
  return palette[deriveUnicon(input).colorIndex] ?? palette[0]
}

/** Layout math shared by both legs — identical geometry, identical avatar. */
export interface UniconGeometry {
  /** Scale from the 48px glyph viewBox to the rendered size (legacy's `size / 48 / 1.5`). */
  scale: number
  /** X/Y offset centering the scaled glyph in the container. */
  translate: number
  /** Edge length of the centered custom-icon box (~40% of the container). */
  iconSize: number
  /** X/Y offset of the custom-icon box. Web-only: the `foreignObject` coordinate; native centers the box with flexbox instead. */
  iconOffset: number
}

export function uniconGeometry({ size, bare }: { size: number; bare?: boolean }): UniconGeometry {
  const scale = bare ? size / GLYPH_VIEWBOX_SIZE : size / GLYPH_VIEWBOX_SIZE / 1.5
  const scaledSize = GLYPH_VIEWBOX_SIZE * scale
  const translate = (size - scaledSize) / 2

  // Custom icons center at ~40% of the container size
  const iconSize = Math.round(size * 0.4)
  const iconOffset = (size - iconSize) / 2

  return { scale, translate, iconSize, iconOffset }
}
