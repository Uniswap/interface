import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import {
  computeAnchoredPosition,
  getSide,
  resolveOffset,
  useAnchoredPosition,
} from 'ui/src/components/coachmark/hooks/useAnchoredPosition'
import { SharedUIUniswapProvider } from 'ui/src/test/render'
import { beforeAll, describe, expect, it } from 'vitest'

// Tamagui's layout path relies on IntersectionObserver, which jsdom does not provide.
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

const TRIGGER = { x: 100, y: 200, width: 50, height: 20 }
const BUBBLE = { width: 190, height: 60 }
const SCREEN_WIDTH = 400
const BEAK_WIDTH = 12

function wrapper({ children }: PropsWithChildren): JSX.Element {
  return <SharedUIUniswapProvider>{children}</SharedUIUniswapProvider>
}

function bubbleLayoutEvent(width: number, height: number): LayoutChangeEvent {
  return { nativeEvent: { layout: { x: 0, y: 0, width, height } } } as LayoutChangeEvent
}

describe('resolveOffset', () => {
  it('treats a number as mainAxis with zero crossAxis', () => {
    expect(resolveOffset(12)).toEqual({ mainAxis: 12, crossAxis: 0 })
    expect(resolveOffset(-16)).toEqual({ mainAxis: -16, crossAxis: 0 })
  })

  it('reads mainAxis and crossAxis from an object', () => {
    expect(resolveOffset({ mainAxis: -16, crossAxis: 4 })).toEqual({ mainAxis: -16, crossAxis: 4 })
  })

  it('defaults missing object fields to zero', () => {
    expect(resolveOffset({ mainAxis: 8 })).toEqual({ mainAxis: 8, crossAxis: 0 })
    expect(resolveOffset({})).toEqual({ mainAxis: 0, crossAxis: 0 })
  })

  it('returns zeros when offset is undefined', () => {
    expect(resolveOffset(undefined)).toEqual({ mainAxis: 0, crossAxis: 0 })
  })
})

describe('getSide', () => {
  it('maps top placements to the top side', () => {
    expect(getSide('top-start')).toBe('top')
    expect(getSide('top-end')).toBe('top')
    expect(getSide('top')).toBe('top')
  })

  it('maps everything else to the bottom side', () => {
    expect(getSide('bottom-start')).toBe('bottom')
    expect(getSide('bottom')).toBe('bottom')
  })
})

describe('computeAnchoredPosition', () => {
  it('places a bottom-start bubble below and left-aligned to the trigger, beak centered', () => {
    expect(
      computeAnchoredPosition({
        placement: 'bottom-start',
        offset: undefined,
        triggerLayout: TRIGGER,
        bubbleSize: BUBBLE,
        screenWidth: SCREEN_WIDTH,
        beakWidth: BEAK_WIDTH,
      }),
    ).toEqual({ top: 220, left: 100, arrowLeft: 89 })
  })

  it('places a top-start bubble above the trigger', () => {
    expect(
      computeAnchoredPosition({
        placement: 'top-start',
        offset: undefined,
        triggerLayout: TRIGGER,
        bubbleSize: BUBBLE,
        screenWidth: SCREEN_WIDTH,
        beakWidth: BEAK_WIDTH,
      }),
    ).toEqual({ top: 140, left: 100, arrowLeft: 89 })
  })

  it('right-aligns an -end placement to the trigger, clamping to the screen edge', () => {
    expect(
      computeAnchoredPosition({
        placement: 'bottom-end',
        offset: undefined,
        triggerLayout: TRIGGER,
        bubbleSize: BUBBLE,
        screenWidth: SCREEN_WIDTH,
        beakWidth: BEAK_WIDTH,
      }).left,
    ).toBe(16)
  })

  it('centers an unaligned placement on the trigger', () => {
    expect(
      computeAnchoredPosition({
        placement: 'bottom',
        offset: undefined,
        triggerLayout: TRIGGER,
        bubbleSize: BUBBLE,
        screenWidth: SCREEN_WIDTH,
        beakWidth: BEAK_WIDTH,
      }).left,
    ).toBe(30)
  })

  it('applies mainAxis offset along the placement direction', () => {
    expect(
      computeAnchoredPosition({
        placement: 'bottom-start',
        offset: 16,
        triggerLayout: TRIGGER,
        bubbleSize: BUBBLE,
        screenWidth: SCREEN_WIDTH,
        beakWidth: BEAK_WIDTH,
      }).top,
    ).toBe(236)
  })

  it('applies negative mainAxis and crossAxis from an offset object', () => {
    expect(
      computeAnchoredPosition({
        placement: 'bottom-start',
        offset: { mainAxis: -16, crossAxis: 4 },
        triggerLayout: TRIGGER,
        bubbleSize: BUBBLE,
        screenWidth: SCREEN_WIDTH,
        beakWidth: BEAK_WIDTH,
      }),
    ).toMatchObject({ top: 204, left: 104 })
  })

  it('clamps the bubble within the screen padding on both edges', () => {
    const right = computeAnchoredPosition({
      placement: 'bottom-start',
      offset: undefined,
      triggerLayout: { ...TRIGGER, x: 380 },
      bubbleSize: BUBBLE,
      screenWidth: SCREEN_WIDTH,
      beakWidth: BEAK_WIDTH,
    })
    expect(right.left).toBe(194)

    const left = computeAnchoredPosition({
      placement: 'bottom-start',
      offset: undefined,
      triggerLayout: { ...TRIGGER, x: 0 },
      bubbleSize: BUBBLE,
      screenWidth: SCREEN_WIDTH,
      beakWidth: BEAK_WIDTH,
    })
    expect(left.left).toBe(16)
  })

  it('always centers the beak on the bubble regardless of placement', () => {
    const arrowLefts = (['bottom-start', 'bottom-end', 'top-start', 'bottom'] as const).map(
      (placement) =>
        computeAnchoredPosition({
          placement,
          offset: undefined,
          triggerLayout: TRIGGER,
          bubbleSize: BUBBLE,
          screenWidth: SCREEN_WIDTH,
          beakWidth: BEAK_WIDTH,
        }).arrowLeft,
    )
    expect(arrowLefts).toEqual([89, 89, 89, 89])
  })
})

describe('useAnchoredPosition', () => {
  it('returns no position until the trigger and bubble are measured', () => {
    const { result } = renderHook(
      () => useAnchoredPosition({ open: false, placement: 'bottom-start', offset: undefined, beakWidth: BEAK_WIDTH }),
      { wrapper },
    )

    expect(result.current.position).toBeNull()
    expect(result.current.side).toBe('bottom')
    expect(result.current.hasBubbleSize).toBe(false)
  })

  it('derives the side from the placement', () => {
    const { result } = renderHook(
      () => useAnchoredPosition({ open: false, placement: 'top-start', offset: undefined, beakWidth: BEAK_WIDTH }),
      { wrapper },
    )

    expect(result.current.side).toBe('top')
  })

  it('tracks the bubble size from onBubbleLayout but stays unpositioned without a measured trigger', () => {
    const { result } = renderHook(
      () => useAnchoredPosition({ open: true, placement: 'bottom-start', offset: undefined, beakWidth: BEAK_WIDTH }),
      { wrapper },
    )

    act(() => {
      result.current.onBubbleLayout(bubbleLayoutEvent(BUBBLE.width, BUBBLE.height))
    })

    expect(result.current.hasBubbleSize).toBe(true)
    expect(result.current.position).toBeNull()
  })

  it('does not throw when measuring before the trigger ref is attached', () => {
    const { result } = renderHook(
      () => useAnchoredPosition({ open: true, placement: 'bottom-start', offset: undefined, beakWidth: BEAK_WIDTH }),
      { wrapper },
    )

    expect(() => act(() => result.current.measureTrigger())).not.toThrow()
  })
})
