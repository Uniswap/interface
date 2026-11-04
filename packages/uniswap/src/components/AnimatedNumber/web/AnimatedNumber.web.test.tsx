import { act, fireEvent } from '@testing-library/react'
import { TestID } from '@universe/test'
import { AnimatedNumberCore } from 'uniswap/src/components/AnimatedNumber/AnimatedNumber.web'
import { SLOT_PREV_CLEAR_DELAY_MS, STAGGER_MS } from 'uniswap/src/components/AnimatedNumber/animationConfig'
import { render } from 'uniswap/src/test/test-utils'

const VALUE = '$1.69B'
const NEXT_VALUE = '$1.71B'
const SETTLE_MS = VALUE.length * STAGGER_MS + SLOT_PREV_CLEAR_DELAY_MS

function getContainer(): HTMLElement {
  const container = document.querySelector(`[data-testid="${TestID.AnimatedNumber}"]`)
  if (!(container instanceof HTMLElement)) {
    throw new Error('AnimatedNumber container not rendered')
  }
  return container
}

/** The plain-text value and the roll cells, told apart by `aria-hidden` (only the cells carry it). */
function getParts(): { staticValue: HTMLElement; cells: HTMLElement } {
  const container = getContainer()
  const cells = container.querySelector<HTMLElement>('span[aria-hidden="true"]')
  const staticValue = cells?.previousElementSibling
  if (!cells || !(staticValue instanceof HTMLElement)) {
    throw new Error('static value or roll cells not rendered')
  }
  return { staticValue, cells }
}

describe('AnimatedNumber.web plain value at rest, roll cells while rolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the value as plain selectable text and keeps the roll cells hidden on first render', () => {
    render(<AnimatedNumberCore value={VALUE} />)

    const { staticValue, cells } = getParts()

    expect(staticValue.textContent).toBe(VALUE)
    expect(staticValue.style.opacity).toBe('1')
    expect(staticValue.closest('[aria-hidden="true"]')).toBeNull()
    expect(staticValue.style.userSelect).toBe('')
    expect(cells.style.visibility).toBe('hidden')
    expect(cells.style.userSelect).toBe('none')
  })

  it('swaps to the roll cells when the value changes, keeping the real value in the DOM, then swaps back', () => {
    const { rerender } = render(<AnimatedNumberCore value={VALUE} />)

    rerender(<AnimatedNumberCore value={NEXT_VALUE} />)
    const rolling = getParts()

    expect(rolling.cells.style.visibility).toBe('visible')
    expect(rolling.staticValue.style.opacity).toBe('0')
    expect(rolling.staticValue.textContent).toBe(NEXT_VALUE)

    act(() => {
      vi.advanceTimersByTime(SETTLE_MS)
    })
    const settled = getParts()

    expect(settled.cells.style.visibility).toBe('hidden')
    expect(settled.staticValue.style.opacity).toBe('1')
    expect(settled.staticValue.textContent).toBe(NEXT_VALUE)
  })

  it('restarts the rolling window when the value changes again mid-roll', () => {
    const { rerender } = render(<AnimatedNumberCore value={VALUE} />)

    rerender(<AnimatedNumberCore value={NEXT_VALUE} />)
    act(() => {
      vi.advanceTimersByTime(SETTLE_MS - 10)
    })
    rerender(<AnimatedNumberCore value="$1.72B" />)
    act(() => {
      vi.advanceTimersByTime(SETTLE_MS - 10)
    })

    expect(getParts().cells.style.visibility).toBe('visible')

    act(() => {
      vi.advanceTimersByTime(10)
    })

    expect(getParts().cells.style.visibility).toBe('hidden')
    expect(getParts().staticValue.textContent).toBe('$1.72B')
  })

  describe('selection on the plain value', () => {
    function selectChars({ value, from, to }: { value: HTMLElement; from: number; to: number }): void {
      const walker = document.createTreeWalker(value, NodeFilter.SHOW_TEXT)
      const nodes: Text[] = []
      while (walker.nextNode()) {
        nodes.push(walker.currentNode as Text)
      }
      const range = document.createRange()
      range.setStart(nodes[from] as Text, 0)
      range.setEnd(nodes[to] as Text, (nodes[to] as Text).length)
      window.getSelection()?.removeAllRanges()
      window.getSelection()?.addRange(range)
    }

    it('leaves a partial drag selection exactly as the browser made it', () => {
      render(<AnimatedNumberCore value={VALUE} />)
      const { staticValue } = getParts()

      fireEvent.mouseDown(staticValue, { button: 0, detail: 1 })
      selectChars({ value: staticValue, from: 1, to: 3 })
      fireEvent.mouseUp(document)
      fireEvent.click(staticValue, { detail: 1 })

      expect(window.getSelection()?.toString()).toBe('1.6')
    })

    it('selects exactly the whole value, `$` included, on double-click', () => {
      render(<AnimatedNumberCore value={VALUE} />)
      const { staticValue } = getParts()
      selectChars({ value: staticValue, from: 1, to: 5 })

      fireEvent.doubleClick(staticValue)

      expect(window.getSelection()?.toString()).toBe(VALUE)
    })

    it('selects exactly the value on triple-click, with no trailing newline', () => {
      render(<AnimatedNumberCore value={VALUE} />)
      const { staticValue } = getParts()
      selectChars({ value: staticValue, from: 0, to: 5 })

      fireEvent.click(staticValue, { detail: 3 })

      expect(window.getSelection()?.toString()).toBe(VALUE)
    })

    it('leaves a single click without a selection', () => {
      render(<AnimatedNumberCore value={VALUE} />)
      const { staticValue } = getParts()
      window.getSelection()?.removeAllRanges()

      fireEvent.click(staticValue, { detail: 1 })

      expect(window.getSelection()?.toString()).toBe('')
    })

    it('keeps a whole-value selection when the value updates', () => {
      const { rerender } = render(<AnimatedNumberCore value={VALUE} />)
      const { staticValue } = getParts()
      fireEvent.doubleClick(staticValue)

      rerender(<AnimatedNumberCore value={NEXT_VALUE} />)

      expect(window.getSelection()?.toString()).toBe(NEXT_VALUE)
    })
  })

  it('announces the value once, from the plain text', () => {
    render(<AnimatedNumberCore value={VALUE} />)

    const announced = Array.from(getContainer().querySelectorAll('span')).filter(
      (el) => el.closest('[aria-hidden="true"]') === null && el.textContent === VALUE,
    )

    expect(announced).toHaveLength(1)
  })

  it('keeps an EndElement outside the number', () => {
    render(<AnimatedNumberCore value={VALUE} EndElement={<button type="button">refresh</button>} />)

    const { staticValue, cells } = getParts()
    const button = getContainer().querySelector('button')

    expect(staticValue.contains(button)).toBe(false)
    expect(cells.contains(button)).toBe(false)
  })

  it('renders plain text with no roll cells when animations are disabled', () => {
    render(<AnimatedNumberCore disableAnimations value={VALUE} />)

    const container = getContainer()

    expect(container.textContent).toBe(VALUE)
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull()
  })
})
