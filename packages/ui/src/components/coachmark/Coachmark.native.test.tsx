import { fireEvent, render, screen } from '@testing-library/react'
import { Text } from '@universe/mycelium'
import { colorsLight } from '@universe/mycelium/theme-palette'
import { zIndexes } from '@universe/mycelium/tokens'
import {
  Coachmark,
  COACHMARK_BUBBLE_TEST_ID,
  CoachmarkBubble,
  getNativePlacement,
} from 'ui/src/components/coachmark/Coachmark.native'
import { SharedUIUniswapProvider } from 'ui/src/test/render'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const { contentPropsSpy, arrowPropsSpy } = vi.hoisted(() => ({
  contentPropsSpy: vi.fn(),
  arrowPropsSpy: vi.fn(),
}))

// expo-blur is a transitive dep of TouchableArea and ships JSX in a `.js` file that Vite refuses to
// parse. Mock it so importing the native Coachmark module graph doesn't fail.
vi.mock('expo-blur', () => ({
  BlurView: () => null,
}))

// The floating-overlay primitive is native-only (its base leg throws outside Metro's
// `.native` resolution) and carries its own behavioral suite in mycelium. This mock keeps
// the primitive's public contract shape — Root owns open state, Content renders only while
// open with a press-to-dismiss backdrop, Arrow is a leaf — so the tests cover Coachmark's
// own wiring: prop pass-through, dismiss routing, and bubble rendering.
vi.mock('@universe/mycelium/floating-overlay', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/mycelium/floating-overlay')>()
  const { createContext, createElement, useContext } = await import('react')

  interface MockRootValue {
    open: boolean
    onOpenChange?: (open: boolean) => void
  }
  const MockRootContext = createContext<MockRootValue>({ open: false })

  function FloatingOverlayRoot(props: {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children?: React.ReactNode
  }): JSX.Element {
    return createElement(
      MockRootContext.Provider,
      { value: { open: props.open ?? false, onOpenChange: props.onOpenChange } },
      props.children,
    )
  }

  function FloatingOverlayContent(props: {
    onPressOutside?: () => void
    children?: React.ReactNode
  }): JSX.Element | null {
    const { open, onOpenChange } = useContext(MockRootContext)
    contentPropsSpy(props)
    if (!open) {
      return null
    }
    const backdrop = createElement('button', {
      'data-testid': 'mock-overlay-backdrop',
      onClick: (): void => {
        props.onPressOutside?.()
        onOpenChange?.(false)
      },
    })
    return createElement('div', null, backdrop, props.children)
  }

  function FloatingOverlayAnchor(props: { children?: React.ReactNode }): JSX.Element {
    return createElement('div', { 'data-testid': 'mock-overlay-anchor' }, props.children)
  }

  function FloatingOverlayArrow(props: Record<string, unknown>): JSX.Element {
    arrowPropsSpy(props)
    return createElement('div', { 'data-testid': 'mock-overlay-arrow' })
  }

  return { ...actual, FloatingOverlayRoot, FloatingOverlayContent, FloatingOverlayAnchor, FloatingOverlayArrow }
})

// Tamagui's measure path relies on IntersectionObserver, which jsdom does not provide.
// A no-op keeps measure from throwing.
beforeAll(() => {
  globalThis.IntersectionObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): [] {
      return []
    }
  } as unknown as typeof IntersectionObserver
})

const COACHMARK_TEXT = 'Pool positions are now included in your total balance'
const COACHMARK_TITLE = 'Start earning'
const CHILD_TEXT = 'balance'

describe('Coachmark (native)', () => {
  beforeEach(() => {
    contentPropsSpy.mockClear()
    arrowPropsSpy.mockClear()
  })

  it('renders its children when closed', () => {
    render(
      <SharedUIUniswapProvider>
        <Coachmark open={false} onDismiss={vi.fn()} text={COACHMARK_TEXT}>
          <Text>{CHILD_TEXT}</Text>
        </Coachmark>
      </SharedUIUniswapProvider>,
    )
    expect(screen.queryByText(CHILD_TEXT)).not.toBeNull()
  })

  it('does not render the coachmark text when closed', () => {
    render(
      <SharedUIUniswapProvider>
        <Coachmark open={false} onDismiss={vi.fn()} text={COACHMARK_TEXT}>
          <Text>{CHILD_TEXT}</Text>
        </Coachmark>
      </SharedUIUniswapProvider>,
    )
    expect(screen.queryByText(COACHMARK_TEXT)).toBeNull()
  })

  it('renders the coachmark text and title when open', () => {
    render(
      <SharedUIUniswapProvider>
        <Coachmark open title={COACHMARK_TITLE} onDismiss={vi.fn()} text={COACHMARK_TEXT}>
          <Text>{CHILD_TEXT}</Text>
        </Coachmark>
      </SharedUIUniswapProvider>,
    )
    expect(screen.queryByText(COACHMARK_TEXT)).not.toBeNull()
    expect(screen.queryByText(COACHMARK_TITLE)).not.toBeNull()
  })

  it('uses the custom width for the bubble', () => {
    render(
      <SharedUIUniswapProvider>
        <Coachmark open width={240} onDismiss={vi.fn()} text={COACHMARK_TEXT}>
          <Text>{CHILD_TEXT}</Text>
        </Coachmark>
      </SharedUIUniswapProvider>,
    )
    const bubble = screen.getByTestId(COACHMARK_BUBBLE_TEST_ID)
    expect(bubble.style.getPropertyValue('--c-w')).toBe('240px')
  })

  it('calls onDismiss when the bubble is pressed', () => {
    const onDismiss = vi.fn()
    render(
      <SharedUIUniswapProvider>
        <Coachmark open onDismiss={onDismiss} text={COACHMARK_TEXT}>
          <Text>{CHILD_TEXT}</Text>
        </Coachmark>
      </SharedUIUniswapProvider>,
    )
    fireEvent.click(screen.getByText(COACHMARK_TEXT))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('calls onDismiss when the backdrop is pressed', () => {
    const onDismiss = vi.fn()
    render(
      <SharedUIUniswapProvider>
        <Coachmark open onDismiss={onDismiss} text={COACHMARK_TEXT}>
          <Text>{CHILD_TEXT}</Text>
        </Coachmark>
      </SharedUIUniswapProvider>,
    )
    fireEvent.click(screen.getByTestId('mock-overlay-backdrop'))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('passes the legacy overlay contract to the primitive', () => {
    render(
      <SharedUIUniswapProvider>
        <Coachmark open placement="bottom-start" onDismiss={vi.fn()} text={COACHMARK_TEXT}>
          <Text>{CHILD_TEXT}</Text>
        </Coachmark>
      </SharedUIUniswapProvider>,
    )
    expect(contentPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        placement: 'bottom-start',
        viewportPadding: 16,
        flip: false,
        dismissOnBackPress: false,
        zIndex: zIndexes.overlay,
      }),
    )
  })

  it('passes a caller-supplied zIndex through to the primitive', () => {
    render(
      <SharedUIUniswapProvider>
        <Coachmark open zIndex={1234} onDismiss={vi.fn()} text={COACHMARK_TEXT}>
          <Text>{CHILD_TEXT}</Text>
        </Coachmark>
      </SharedUIUniswapProvider>,
    )
    expect(contentPropsSpy).toHaveBeenCalledWith(expect.objectContaining({ zIndex: 1234 }))
  })

  it('passes the inverse-resolved beak color and the seam nudge to the arrow', () => {
    render(
      <SharedUIUniswapProvider>
        <Coachmark open placement="bottom-start" onDismiss={vi.fn()} text={COACHMARK_TEXT}>
          <Text>{CHILD_TEXT}</Text>
        </Coachmark>
      </SharedUIUniswapProvider>,
    )
    expect(arrowPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        // The test harness pins the dark theme, so the inverse bubble resolves light-theme colors.
        color: colorsLight.surface1,
        size: 12,
        // Content sits below the anchor: the beak rides the top edge and nudges 1px down into the bubble.
        style: { transform: [{ translateY: 1 }] },
      }),
    )
  })

  it('flips the seam nudge for top placements', () => {
    render(
      <SharedUIUniswapProvider>
        <Coachmark open placement="top" onDismiss={vi.fn()} text={COACHMARK_TEXT}>
          <Text>{CHILD_TEXT}</Text>
        </Coachmark>
      </SharedUIUniswapProvider>,
    )
    expect(arrowPropsSpy).toHaveBeenCalledWith(expect.objectContaining({ style: { transform: [{ translateY: -1 }] } }))
  })

  it('coerces horizontal placements to bottom, keeping the alignment', () => {
    render(
      <SharedUIUniswapProvider>
        <Coachmark open placement="left-start" onDismiss={vi.fn()} text={COACHMARK_TEXT}>
          <Text>{CHILD_TEXT}</Text>
        </Coachmark>
      </SharedUIUniswapProvider>,
    )
    expect(contentPropsSpy).toHaveBeenCalledWith(expect.objectContaining({ placement: 'bottom-start' }))
  })
})

describe('getNativePlacement', () => {
  it('keeps vertical placements as-is', () => {
    expect(getNativePlacement('top')).toBe('top')
    expect(getNativePlacement('top-end')).toBe('top-end')
    expect(getNativePlacement('bottom-start')).toBe('bottom-start')
  })

  it('coerces horizontal sides to bottom', () => {
    expect(getNativePlacement('left')).toBe('bottom')
    expect(getNativePlacement('right-end')).toBe('bottom-end')
  })
})

describe('CoachmarkBubble', () => {
  it('renders the coachmark text', () => {
    render(
      <SharedUIUniswapProvider>
        <CoachmarkBubble text={COACHMARK_TEXT} onDismiss={vi.fn()} />
      </SharedUIUniswapProvider>,
    )
    const bubble = screen.getByTestId(COACHMARK_BUBBLE_TEST_ID)
    expect(screen.queryByText(COACHMARK_TEXT)).not.toBeNull()
    expect(bubble.style.getPropertyValue('--c-w')).toBe('190px')
  })

  it('renders an optional coachmark title', () => {
    render(
      <SharedUIUniswapProvider>
        <CoachmarkBubble title={COACHMARK_TITLE} text={COACHMARK_TEXT} onDismiss={vi.fn()} />
      </SharedUIUniswapProvider>,
    )
    expect(screen.getByText(COACHMARK_TITLE)).not.toBeNull()
  })

  it('calls onDismiss when pressed', () => {
    const onDismiss = vi.fn()
    render(
      <SharedUIUniswapProvider>
        <CoachmarkBubble text={COACHMARK_TEXT} onDismiss={onDismiss} />
      </SharedUIUniswapProvider>,
    )
    fireEvent.click(screen.getByText(COACHMARK_TEXT))
    expect(onDismiss).toHaveBeenCalled()
  })
})
