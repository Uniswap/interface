import { TokenCardCarousel } from '~/components/TokenCardCarousel/TokenCardCarousel'
import type { useHorizontalSnapCarousel } from '~/components/TokenCardCarousel/useHorizontalSnapCarousel'
import { render } from '~/test-utils/render'

function createCarousel(
  overrides: Partial<ReturnType<typeof useHorizontalSnapCarousel>> = {},
): ReturnType<typeof useHorizontalSnapCarousel> {
  return {
    setScrollRef: vi.fn(),
    isAtEnd: false,
    isAtStart: true,
    isScrollSettled: true,
    isHovered: false,
    showButton: vi.fn(),
    hideButton: vi.fn(),
    onNext: vi.fn(),
    onPrev: vi.fn(),
    ...overrides,
  }
}

function renderCarousel(
  props: Partial<Parameters<typeof TokenCardCarousel<string>>[0]> = {},
): ReturnType<typeof render> {
  return render(
    <TokenCardCarousel<string>
      items={['a', 'b', 'c']}
      getItemKey={(item) => item}
      renderItem={(item) => <div data-testid={`card-${item}`} />}
      isLoading={false}
      skeletonCount={3}
      carousel={createCarousel()}
      cardWidth={150}
      fadeWidth={24}
      showArrowButtons={false}
      {...props}
    />,
  )
}

function getScroller(container: HTMLElement): HTMLElement {
  return container.querySelector('.scrollbar-hidden') as HTMLElement
}

/** Everything rendered next to the scroller: the left and right overlay fades when arrows are off. */
function getOverlayFades(container: HTMLElement): Element[] {
  const scroller = getScroller(container)
  return [...(scroller.parentElement?.children ?? [])].filter((el) => el !== scroller)
}

describe(TokenCardCarousel, () => {
  it('paints overlay fades by default and leaves the scroller unmasked', () => {
    const { container } = renderCarousel()

    expect(getOverlayFades(container)).toHaveLength(2)
    expect(getScroller(container).style.maskImage).toBe('')
  })

  it.each([
    { isAtStart: true, isAtEnd: false, mask: 'linear-gradient(to right, black calc(100% - 24px), transparent)' },
    {
      isAtStart: false,
      isAtEnd: false,
      mask: 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)',
    },
    { isAtStart: false, isAtEnd: true, mask: 'linear-gradient(to right, transparent, black 24px)' },
  ])('in mask mode, fades only the clipped edges (start $isAtStart, end $isAtEnd)', ({ isAtStart, isAtEnd, mask }) => {
    const { container } = renderCarousel({ edgeFade: 'mask', carousel: createCarousel({ isAtStart, isAtEnd }) })

    expect(getOverlayFades(container)).toHaveLength(0)
    expect(getScroller(container).style.maskImage).toBe(mask)
  })

  it('pads and snaps to the edge inset', () => {
    const { container } = renderCarousel({ edgeInset: 16 })

    const scroller = getScroller(container)
    expect(scroller.style.paddingInline).toBe('16px')
    expect(scroller.style.scrollPaddingInline).toBe('16px')
  })
})
