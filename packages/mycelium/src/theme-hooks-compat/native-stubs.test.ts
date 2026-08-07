/**
 * The native legs of the theme-hooks compat are throwing stubs until the
 * native parity harness lands (INFRA-2353) — importing one on native must fail
 * loudly rather than render unverified values. These tests pin that contract;
 * the (currently skipped) native parity suite lives in
 * packages/tailwind/src/parity/theme-hooks/native-parity.test.ts.
 */
import { PlatformSplitStubError } from '@universe/environment'
import { describe, expect, it } from 'vitest'
import { opacify, opacifyRaw } from './opacify.native'
import { useDeviceDimensions } from './useDeviceDimensions.native'
import { useIsDarkMode } from './useIsDarkMode.native'
import { useMedia } from './useMedia.native'
import { useSporeColors } from './useSporeColors.native'

const STUBS: ReadonlyArray<[string, () => unknown]> = [
  ['useSporeColors', () => useSporeColors()],
  ['useIsDarkMode', () => useIsDarkMode()],
  ['useMedia', () => useMedia()],
  ['useDeviceDimensions', () => useDeviceDimensions()],
  ['opacify', () => opacify(50, '#FFFFFF')],
  ['opacifyRaw', () => opacifyRaw(50, '#FFFFFF')],
]

describe('theme-hooks compat native stubs', () => {
  it.each(STUBS)('%s throws a PlatformSplitStubError referencing INFRA-2353', (_name, call) => {
    expect(call).toThrowError(/INFRA-2353/)
    expect(call).toThrowError(PlatformSplitStubError)
  })
})
