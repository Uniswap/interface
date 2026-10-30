import type { BottomSheetBackdropProps, BottomSheetHandleProps } from '@gorhom/bottom-sheet'
import type { ComponentType, ReactNode } from 'react'
import { BottomSheetDetachedModal, Modal } from 'uniswap/src/components/modals/Modal.native'
import type { ModalProps } from 'uniswap/src/components/modals/ModalProps'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { render } from 'uniswap/src/test/test-utils'

const sheetPropsSpy = vi.hoisted(() => vi.fn())
const bottomInsetCoverFooterSpy = vi.hoisted(() => vi.fn())
const loggerWarnSpy = vi.hoisted(() => vi.fn())

// jsdom resolves this platform-split hook's `.web` leg, which throws instead of returning a value.
vi.mock('uniswap/src/utils/useKeyboardLayout', () => ({
  useKeyboardLayout: () => ({ isVisible: false, containerHeight: 0 }),
}))

vi.mock('uniswap/src/components/modals/useBottomInsetCoverFooter', () => ({
  useBottomInsetCoverFooter: bottomInsetCoverFooterSpy,
}))

vi.mock('utilities/src/logger/logger', () => ({
  logger: { warn: loggerWarnSpy, error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

vi.mock('@gorhom/bottom-sheet', async () => {
  const { View } = (await import('react-native')) as unknown as { View: ComponentType<{ children?: ReactNode }> }
  return {
    BottomSheetModal: (props: Record<string, unknown>) => {
      sheetPropsSpy(props)
      return null
    },
    BottomSheetBackdrop: View,
    BottomSheetView: View,
    BottomSheetTextInput: View,
  }
})

type SheetProps = {
  footerComponent?: unknown
  enableContentPanningGesture?: boolean
  enableHandlePanningGesture?: boolean
  enablePanDownToClose?: boolean
  handleComponent?: (props: BottomSheetHandleProps) => ReactNode
  backdropComponent?: (props: BottomSheetBackdropProps) => { props: { isDismissible?: boolean } }
}

const handleArgs = {} as BottomSheetHandleProps
const backdropArgs = {} as BottomSheetBackdropProps

function sheetPropsFor(props: Partial<ModalProps>): SheetProps {
  sheetPropsSpy.mockClear()
  render(<Modal name={ModalName.Send} {...props} />)
  return (sheetPropsSpy.mock.calls[0]?.[0] ?? {}) as SheetProps
}

function contentPanningFor(props: Partial<ModalProps>): unknown {
  return sheetPropsFor(props).enableContentPanningGesture
}

function detachedSheetPropsFor(props: Partial<ModalProps>): SheetProps {
  sheetPropsSpy.mockClear()
  render(<BottomSheetDetachedModal name={ModalName.Send} {...props} />)
  return (sheetPropsSpy.mock.calls[0]?.[0] ?? {}) as SheetProps
}

function detachedContentPanningFor(props: Partial<ModalProps>): unknown {
  return detachedSheetPropsFor(props).enableContentPanningGesture
}

function warningsFor(props: Partial<ModalProps>): unknown[][] {
  loggerWarnSpy.mockClear()
  render(<Modal name={ModalName.Send} {...props} />)
  return loggerWarnSpy.mock.calls
}

describe('Modal content panning default', () => {
  it('is on for a multi-detent sheet, where a content drag moves between detents', () => {
    expect(contentPanningFor({ snapPoints: ['60%', '100%'] })).toBe(true)
  })

  it('is off for a dynamically sized sheet with a handle and a backdrop', () => {
    expect(contentPanningFor({})).toBe(false)
  })

  it('is off for a single-entry snap point array', () => {
    expect(contentPanningFor({ snapPoints: [336] })).toBe(false)
  })

  it('is on when a fullScreen sheet has neither a handle nor a pressable backdrop', () => {
    expect(contentPanningFor({ fullScreen: true, hideHandlebar: true, renderBehindTopInset: true })).toBe(true)
  })

  it('is off on the no-affordance shape when the sheet is not dismissible', () => {
    expect(
      contentPanningFor({ fullScreen: true, hideHandlebar: true, renderBehindTopInset: true, isDismissible: false }),
    ).toBe(false)
  })

  it('is off for a fullScreen sheet that still renders its handle', () => {
    expect(contentPanningFor({ fullScreen: true, renderBehindTopInset: true })).toBe(false)
  })

  it('is off for a fullScreen sheet that hides its handle but keeps the top inset', () => {
    expect(contentPanningFor({ fullScreen: true, hideHandlebar: true })).toBe(false)
  })

  // WarningModal's report sub-modal: hiding the handle alone is not the no-affordance shape, because
  // a non-fullScreen sheet still has a pressable backdrop. It hosts a BottomSheetTextInput.
  it('is off for a sheet that hides its handle but is not fullScreen', () => {
    expect(contentPanningFor({ hideHandlebar: true, isDismissible: true })).toBe(false)
  })

  // A caller can drive `fullScreen` and `hideHandlebar` from one state value, so the handle comes and goes.
  it.each([
    [true, true],
    [false, false],
  ])('follows a handle that is toggled at runtime: fullscreen=%s -> %s', (fullscreen, expected) => {
    expect(contentPanningFor({ renderBehindTopInset: true, fullScreen: fullscreen, hideHandlebar: fullscreen })).toBe(
      expected,
    )
  })

  it('lets an explicit prop from the caller override the derived value', () => {
    expect(contentPanningFor({ snapPoints: ['60%', '100%'], enableContentPanningGesture: false })).toBe(false)
    expect(contentPanningFor({ enableContentPanningGesture: true })).toBe(true)
  })
})

describe('Modal dismiss affordances where the derived default is off', () => {
  it('keeps a draggable handle and a closing backdrop on the swap settings sheet shape', () => {
    const sheet = sheetPropsFor({})

    expect(sheet.enableContentPanningGesture).toBe(false)
    expect(sheet.handleComponent?.(handleArgs)).not.toBeNull()
    expect(sheet.enableHandlePanningGesture).toBe(true)
    expect(sheet.backdropComponent?.(backdropArgs).props.isDismissible).toBe(true)
  })

  it('keeps a handle element and a closing backdrop on the report sub-sheet shape', () => {
    const sheet = sheetPropsFor({ hideHandlebar: true })

    expect(sheet.enableContentPanningGesture).toBe(false)
    expect(sheet.handleComponent?.(handleArgs)).not.toBeNull()
    expect(sheet.backdropComponent?.(backdropArgs).props.isDismissible).toBe(true)
  })

  it('keeps its handle on the label and profile editor shape, where fullScreen covers the backdrop', () => {
    const sheet = sheetPropsFor({ fullScreen: true })

    expect(sheet.enableContentPanningGesture).toBe(false)
    expect(sheet.handleComponent?.(handleArgs)).not.toBeNull()
    expect(sheet.enableHandlePanningGesture).toBe(true)
  })

  it('leaves a handle-less, non-fullScreen sheet with the backdrop as its only derived affordance', () => {
    const sheet = sheetPropsFor({ hideHandlebar: true, renderBehindTopInset: true })

    expect(sheet.enableContentPanningGesture).toBe(false)
    expect(sheet.handleComponent?.(handleArgs)).toBeNull()
    expect(sheet.backdropComponent?.(backdropArgs).props.isDismissible).toBe(true)
  })
})

describe('Modal drag-to-close', () => {
  it('does not let a non-dismissible multi-detent sheet close on a downward drag', () => {
    const sheet = sheetPropsFor({ snapPoints: ['60%', '100%'], isDismissible: false })

    expect(sheet.enableContentPanningGesture).toBe(true)
    expect(sheet.enablePanDownToClose).toBe(false)
  })

  it('keeps a downward drag closing a dismissible sheet', () => {
    expect(sheetPropsFor({ snapPoints: ['60%', '100%'] }).enablePanDownToClose).toBe(true)
  })
})

describe('BottomSheetDetachedModal content panning default', () => {
  it('is on for a multi-detent detached sheet', () => {
    expect(detachedContentPanningFor({ snapPoints: ['60%', '100%'] })).toBe(true)
  })

  it('is off for a dynamically sized detached sheet, which keeps its pressable backdrop', () => {
    expect(detachedContentPanningFor({})).toBe(false)
  })

  it('is off for a single-entry snap point array on a detached sheet', () => {
    expect(detachedContentPanningFor({ snapPoints: [336] })).toBe(false)
  })

  it('lets an explicit prop from the caller override the derived value', () => {
    expect(detachedContentPanningFor({ snapPoints: ['60%', '100%'], enableContentPanningGesture: false })).toBe(false)
    expect(detachedContentPanningFor({ enableContentPanningGesture: true })).toBe(true)
  })
})

describe('BottomSheetDetachedModal drag-to-close', () => {
  it('does not let a non-dismissible multi-detent detached sheet close on a downward drag', () => {
    const sheet = detachedSheetPropsFor({ snapPoints: ['60%', '100%'], isDismissible: false })

    expect(sheet.enableContentPanningGesture).toBe(true)
    expect(sheet.enablePanDownToClose).toBe(false)
  })

  it('keeps a downward drag closing a dismissible detached sheet', () => {
    expect(detachedSheetPropsFor({ snapPoints: ['60%', '100%'] }).enablePanDownToClose).toBe(true)
  })
})

describe('Modal handle-less sheet warning', () => {
  it('warns for a handle-less non-fullScreen sheet that derives panning off', () => {
    expect(warningsFor({ hideHandlebar: true, renderBehindTopInset: true })).toHaveLength(1)
  })

  it('warns for the fullScreen no-affordance shape turned off by an explicit prop', () => {
    expect(
      warningsFor({
        fullScreen: true,
        hideHandlebar: true,
        renderBehindTopInset: true,
        enableContentPanningGesture: false,
      }),
    ).toHaveLength(1)
  })

  it('reports only the modal name', () => {
    const [call] = warningsFor({ hideHandlebar: true, renderBehindTopInset: true })

    expect(call?.[3]).toStrictEqual({ modalName: ModalName.Send })
  })

  // ModalTemplate's shape: handle-less and non-fullScreen, but panning is switched on explicitly.
  it('stays quiet when the caller turns panning on explicitly', () => {
    expect(warningsFor({ hideHandlebar: true, renderBehindTopInset: true, enableContentPanningGesture: true })).toEqual(
      [],
    )
  })

  it('stays quiet while the sheet still renders a handle', () => {
    expect(warningsFor({ hideHandlebar: true })).toEqual([])
    expect(warningsFor({ fullScreen: true, renderBehindTopInset: true })).toEqual([])
  })
})

describe('Modal bottom inset cover', () => {
  it('hands the sheet whatever footer the bottom inset cover hook resolves', () => {
    const resolvedFooter = vi.fn()
    bottomInsetCoverFooterSpy.mockReturnValueOnce(resolvedFooter)

    const sheet = sheetPropsFor({ renderBehindBottomInset: true, coverBottomInsetOnAndroid: true })

    expect(sheet.footerComponent).toBe(resolvedFooter)
    expect(bottomInsetCoverFooterSpy).toHaveBeenCalledWith(
      expect.objectContaining({ renderBehindBottomInset: true, coverBottomInsetOnAndroid: true }),
    )
  })
})
