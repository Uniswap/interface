import type { ReactNode } from 'react'
import { StyleSheet, type ViewStyle } from 'react-native'
import { ModalWithOverlay } from 'src/components/Requests/ModalWithOverlay/ModalWithOverlay'
import { render } from 'src/test/test-utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

const { captured } = vi.hoisted(() => ({ captured: { contentContainerStyle: undefined as unknown } }))

vi.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetScrollView: ({
    children,
    contentContainerStyle,
  }: {
    children: ReactNode
    contentContainerStyle: unknown
  }) => {
    captured.contentContainerStyle = contentContainerStyle
    return children
  },
  BottomSheetFooter: ({ children }: { children: ReactNode }) => children,
  useBottomSheetInternal: () => ({
    animatedPosition: { value: 0 },
    animatedLayoutState: { value: { containerHeight: 0, footerHeight: 0, handleHeight: 0 } },
  }),
}))

vi.mock('uniswap/src/components/modals/Modal', () => ({
  Modal: ({ children }: { children: ReactNode }) => children,
}))

const contentStyle = (): ViewStyle => StyleSheet.flatten(captured.contentContainerStyle as ViewStyle)

describe(ModalWithOverlay, () => {
  // The content container's opaque background makes it an RNGH touch target on Android so empty-space taps don't
  // dismiss the sheet. Native arbitration isn't exercisable here, so just guard that the background isn't dropped.
  it('gives the scroll content container an opaque background so empty-space taps do not reach the backdrop', () => {
    render(
      <ModalWithOverlay name={ModalName.WCPendingConnection} onClose={vi.fn()} onReject={vi.fn()}>
        <span>request</span>
      </ModalWithOverlay>,
    )

    const style = contentStyle()
    expect(typeof style.backgroundColor).toBe('string')
    expect(style.backgroundColor).not.toBe('transparent')
    expect(style.paddingHorizontal).toBeGreaterThan(0)
  })

  it('keeps the background when a caller overrides the content container style', () => {
    render(
      <ModalWithOverlay
        name={ModalName.WCSignRequest}
        contentContainerStyle={{ paddingHorizontal: 0 }}
        onClose={vi.fn()}
        onReject={vi.fn()}
      >
        <span>request</span>
      </ModalWithOverlay>,
    )

    const style = contentStyle()
    expect(style.paddingHorizontal).toBe(0)
    expect(typeof style.backgroundColor).toBe('string')
  })
})
