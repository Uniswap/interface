/**
 * Pins the platform-leg contract of the WebBottomSheet compat (INFRA-3329,
 * FlexCompat platform-legs precedent): the platformless BASE stub fails
 * loudly, and the NATIVE leg renders nothing — mirroring the legacy barrel's
 * native leg (`AdaptiveWebModal.native.tsx`'s standalone `WebBottomSheet`
 * export; native bottom sheets are gorhom-based). Export-shape pin only —
 * the web leg's behavior lives in WebBottomSheet.test.tsx.
 */
import { PlatformSplitStubError } from '@universe/environment'
import { createElement } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { describe, expect, it } from 'vitest'
import { WebBottomSheet as WebBottomSheetNative } from './WebBottomSheet.native'
// react-test-renderer's act() needs the explicit opt-in outside jsdom setups.
// Explicit extensions: the mycelium vitest config resolves `.web.*` first,
// which would silently swap the platformless base leg for the web leg.
import { WebBottomSheet as WebBottomSheetBase } from './WebBottomSheet.tsx'
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('WebBottomSheet platform legs', () => {
  it('the platformless base stub throws the platform-override contract', () => {
    expect(() => WebBottomSheetBase({ isOpen: true, title: 'Sheet' })).toThrowError(PlatformSplitStubError)
    expect(() => WebBottomSheetBase({ isOpen: true, title: 'Sheet' })).toThrowError(
      /Did you forget a platform override\?/,
    )
  })

  it('the native leg renders nothing, open or closed, and never mounts its children', () => {
    let tree: ReactTestRenderer | undefined
    act(() => {
      tree = create(
        createElement(
          WebBottomSheetNative,
          { isOpen: true, title: 'Sheet' },
          createElement('span', null, 'native child'),
        ),
      )
    })
    expect(tree?.toJSON()).toBeNull()
    act(() => {
      tree?.update(
        createElement(
          WebBottomSheetNative,
          { isOpen: false, title: 'Sheet' },
          createElement('span', null, 'native child'),
        ),
      )
    })
    expect(tree?.toJSON()).toBeNull()
    act(() => tree?.unmount())
  })
})
