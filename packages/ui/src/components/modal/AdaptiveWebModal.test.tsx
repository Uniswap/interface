import { renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

// expo-blur is a transitive dep of TouchableArea / Modal.native and ships JSX in a
// `.js` file that Vite refuses to parse. The hook under test doesn't render any UI,
// but the import graph still touches it through Tamagui.
vi.mock('expo-blur', () => ({
  BlurView: () => null,
}))

import {
  EffectiveModalOrSheetZIndexContext,
  useEffectiveModalOrSheetZIndex,
} from 'ui/src/components/modal/AdaptiveWebModal'
import { zIndexes } from 'ui/src/theme'

const withParentContext =
  (value: number | undefined) =>
  ({ children }: PropsWithChildren): JSX.Element => (
    <EffectiveModalOrSheetZIndexContext.Provider value={value}>{children}</EffectiveModalOrSheetZIndexContext.Provider>
  )

describe('useEffectiveModalOrSheetZIndex', () => {
  it('returns zIndexes.modal as floor when no parent context and no explicit zIndex (dialog branch)', () => {
    const { result } = renderHook(() =>
      useEffectiveModalOrSheetZIndex({ adaptToSheet: false, isTopAligned: true, zIndex: undefined }),
    )
    expect(result.current).toBe(zIndexes.modal)
  })

  it('honors explicit zIndex when provided, ignoring parent context', () => {
    const { result } = renderHook(
      () => useEffectiveModalOrSheetZIndex({ adaptToSheet: false, isTopAligned: true, zIndex: 50000 }),
      { wrapper: withParentContext(zIndexes.overlay) },
    )
    expect(result.current).toBe(50000)
  })

  it('stacks one layer above parent context when context is set and no explicit zIndex (the dapp-request case)', () => {
    const { result } = renderHook(
      () => useEffectiveModalOrSheetZIndex({ adaptToSheet: false, isTopAligned: true, zIndex: undefined }),
      { wrapper: withParentContext(zIndexes.overlay) },
    )
    expect(result.current).toBe(zIndexes.overlay + 1)
  })

  it('floors at zIndexes.modal when parent context is below the floor', () => {
    const { result } = renderHook(
      () => useEffectiveModalOrSheetZIndex({ adaptToSheet: false, isTopAligned: true, zIndex: undefined }),
      { wrapper: withParentContext(100) },
    )
    expect(result.current).toBe(zIndexes.modal)
  })
})
