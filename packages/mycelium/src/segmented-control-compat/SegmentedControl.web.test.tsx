import { fireEvent, render, screen } from '@testing-library/react'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { useState, type JSX } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VARIANT_METRICS } from '../text-compat/tokens'
import { SegmentedControl } from './SegmentedControl.web'
import { LABEL_CLASSES_LARGE, LABEL_CLASSES_SMALL } from './style-classes'
import type { SegmentedControlProps } from './types'

const OPTIONS = [{ value: 'one' }, { value: 'two' }, { value: 'three' }] as const

function renderControl(overrides: Partial<SegmentedControlProps> = {}): ReturnType<typeof render> {
  return render(
    <SegmentedControl options={OPTIONS} selectedOption="one" onSelectOption={() => undefined} {...overrides} />,
  )
}

function getOption(value: string): HTMLElement {
  const node = screen.getByText(value).closest('button, a')
  if (!(node instanceof HTMLElement)) {
    throw new Error(`option ${value} did not render as a button or anchor`)
  }
  return node
}

function getIndicator(): HTMLElement {
  return screen.getByTestId('segmented-control-indicator')
}

interface FakeBox {
  left: number
  top: number
  width: number
  height: number
  clientLeft?: number
  clientTop?: number
  offsetParent: HTMLElement | null
}

function fakeLayout(boxFor: (el: HTMLElement) => FakeBox | undefined): void {
  const read = <K extends keyof FakeBox>(key: K, fallback: FakeBox[K]) =>
    function (this: HTMLElement): FakeBox[K] {
      return boxFor(this)?.[key] ?? fallback
    }
  vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(read('left', 0))
  vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(read('top', 0))
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(read('width', 0))
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(read('height', 0))
  vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockImplementation(read('offsetParent', null))
  vi.spyOn(Element.prototype, 'clientLeft', 'get').mockImplementation(function (this: Element) {
    return this instanceof HTMLElement ? (boxFor(this)?.clientLeft ?? 0) : 0
  })
  vi.spyOn(Element.prototype, 'clientTop', 'get').mockImplementation(function (this: Element) {
    return this instanceof HTMLElement ? (boxFor(this)?.clientTop ?? 0) : 0
  })
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const box = this instanceof HTMLElement ? boxFor(this) : undefined
    const scale = 0.95
    const left = 300 + (box?.left ?? 0) * scale
    const top = 120 + (box?.top ?? 0) * scale
    const width = (box?.width ?? 0) * scale
    const height = (box?.height ?? 0) * scale
    return { x: left, y: top, left, top, width, height, right: left + width, bottom: top + height, toJSON: () => ({}) }
  })
}

function tablistOf(el: HTMLElement): HTMLElement | null {
  return el.closest<HTMLElement>('[role="tablist"]')
}

describe('SegmentedControl (web)', () => {
  beforeEach(() => {
    fakeLayout((el) => {
      const tablist = tablistOf(el)
      if (!tablist || !el.matches('button, a')) {
        return undefined
      }
      const index = Array.from(tablist.querySelectorAll('button, a')).indexOf(el)
      return { left: 4 + index * 50, top: 4, width: 42, height: 24, offsetParent: tablist }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders each option as a <button type="button" role="button"> inside the tablist', () => {
    renderControl()
    const tablist = screen.getByRole('tablist')
    expect(tablist.getAttribute('aria-orientation')).toBe('horizontal')
    for (const { value } of OPTIONS) {
      const option = getOption(value)
      expect(option.tagName).toBe('BUTTON')
      expect(option.getAttribute('type')).toBe('button')
      expect(option.getAttribute('role')).toBe('button')
      expect(option.tabIndex).toBe(0)
    }
    expect(getOption('one').getAttribute('aria-selected')).toBe('true')
    expect(getOption('two').getAttribute('aria-selected')).toBe('false')
  })

  it('resets the UA border on every option', () => {
    renderControl()
    for (const { value } of OPTIONS) {
      expect(getOption(value).className).toContain('border-0')
    }
  })

  it('throws the legacy 2-6 options assertion', () => {
    // The component throws during render — silence React's error logging.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() =>
      render(<SegmentedControl options={[{ value: 'only' }]} selectedOption="only" onSelectOption={() => undefined} />),
    ).toThrow('Segmented control must have between 2 and 6 options, inclusive.')
    spy.mockRestore()
  })

  it('selects on click, including re-selecting the already-selected value', () => {
    const onSelectOption = vi.fn()
    renderControl({ onSelectOption })
    fireEvent.click(getOption('two'))
    expect(onSelectOption).toHaveBeenCalledTimes(1)
    expect(onSelectOption).toHaveBeenCalledWith('two')
    fireEvent.click(getOption('one'))
    expect(onSelectOption).toHaveBeenLastCalledWith('one')
  })

  it('never selects a disabled option or any option of a disabled control', () => {
    const onSelectOption = vi.fn()
    const { unmount } = renderControl({
      onSelectOption,
      options: [{ value: 'one' }, { value: 'two', disabled: true }],
    })
    const disabledOption = getOption('two')
    expect(disabledOption).toHaveProperty('disabled', true)
    expect(disabledOption.getAttribute('aria-disabled')).toBe('true')
    expect(disabledOption.tabIndex).toBe(-1)
    fireEvent.click(disabledOption)
    expect(onSelectOption).not.toHaveBeenCalled()
    unmount()

    renderControl({ onSelectOption, disabled: true })
    fireEvent.click(getOption('two'))
    expect(onSelectOption).not.toHaveBeenCalled()
  })

  it('renders href options as anchors with link semantics and select-not-navigate clicks', () => {
    const onSelectOption = vi.fn()
    renderControl({
      onSelectOption,
      options: [{ value: 'one' }, { value: 'two', href: '/two' }, { value: 'three', href: '/three', disabled: true }],
    })
    const anchor = getOption('two')
    expect(anchor.tagName).toBe('A')
    expect(anchor.getAttribute('href')).toBe('/two')
    expect(anchor.getAttribute('role')).toBe('link')
    expect(anchor.className).toContain('no-underline')

    // Disabled anchor: href dropped, role falls back to button (legacy).
    const disabledAnchor = getOption('three')
    expect(disabledAnchor.getAttribute('href')).toBeNull()
    expect(disabledAnchor.getAttribute('role')).toBe('button')

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true })
    anchor.dispatchEvent(clickEvent)
    expect(clickEvent.defaultPrevented).toBe(true)
    expect(onSelectOption).toHaveBeenCalledTimes(1)
    expect(onSelectOption).toHaveBeenCalledWith('two')
  })

  it('selects exactly once on Enter and Space, through the disabled guard', () => {
    const onSelectOption = vi.fn()
    renderControl({ onSelectOption, options: [{ value: 'one' }, { value: 'two', disabled: true }] })
    fireEvent.keyDown(getOption('one'), { key: 'Enter' })
    expect(onSelectOption).toHaveBeenCalledTimes(1)
    expect(onSelectOption).toHaveBeenCalledWith('one')
    fireEvent.keyDown(getOption('one'), { key: ' ' })
    expect(onSelectOption).toHaveBeenCalledTimes(2)
    fireEvent.keyDown(getOption('two'), { key: 'Enter' })
    expect(onSelectOption).toHaveBeenCalledTimes(2)
  })

  it('moves focus with arrow keys across enabled options without looping (legacy roving focus)', () => {
    renderControl({ options: [{ value: 'one' }, { value: 'two', disabled: true }, { value: 'three' }] })
    const first = getOption('one')
    const last = getOption('three')

    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowRight' })
    // The disabled middle option is skipped.
    expect(document.activeElement).toBe(last)
    // No wrap past the end (legacy loop={false}).
    fireEvent.keyDown(last, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(last)
    fireEvent.keyDown(last, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(first)
    fireEvent.keyDown(first, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(first)
    fireEvent.keyDown(first, { key: 'End' })
    expect(document.activeElement).toBe(last)
    fireEvent.keyDown(last, { key: 'Home' })
    expect(document.activeElement).toBe(first)
  })

  it('tracks hover per option: text color + onHoverOption, with the disabled guard', () => {
    const onHoverOption = vi.fn()
    renderControl({ onHoverOption, options: [{ value: 'one' }, { value: 'two' }, { value: 'three', disabled: true }] })
    const idle = screen.getByText('two')
    expect(idle.className).toContain('text-neutral2')

    fireEvent.mouseEnter(getOption('two'))
    expect(onHoverOption).toHaveBeenCalledTimes(1)
    expect(onHoverOption).toHaveBeenCalledWith('two')
    expect(screen.getByText('two').className).toContain('text-neutral1')
    fireEvent.mouseLeave(getOption('two'))
    expect(screen.getByText('two').className).toContain('text-neutral2')

    // Disabled options never hover (legacy <button disabled> suppression,
    // reproduced uniformly).
    fireEvent.mouseEnter(getOption('three'))
    expect(onHoverOption).toHaveBeenCalledTimes(1)
    expect(screen.getByText('three').className).toContain('text-neutral3')
  })

  it('pins the label typography to the legacy buttonLabel3/buttonLabel4 web metrics', () => {
    const large = VARIANT_METRICS.buttonLabel3
    const small = VARIANT_METRICS.buttonLabel4
    expect(LABEL_CLASSES_LARGE).toContain(`text-[${large.fontSize}px]`)
    expect(LABEL_CLASSES_LARGE).toContain(`[line-height:${large.lineHeight}px]`)
    expect(LABEL_CLASSES_LARGE).toContain(`[font-weight:${large.fontWeight}]`)
    expect(LABEL_CLASSES_SMALL).toContain(`text-[${small.fontSize}px]`)
    expect(LABEL_CLASSES_SMALL).toContain(`[line-height:${small.lineHeight}px]`)
    expect(LABEL_CLASSES_SMALL).toContain(`[font-weight:${small.fontWeight}]`)
    for (const classes of [LABEL_CLASSES_LARGE, LABEL_CLASSES_SMALL]) {
      expect(classes).toContain('[font-family:var(--stext-font-medium)]')
      expect(classes).toContain('select-none')
    }

    renderControl({ size: 'large' })
    expect(screen.getByText('one').className).toContain('text-[14px]')
    renderControl({ size: 'default' })
    expect(screen.getAllByText('one').at(-1)?.className).toContain('text-[12px]')
  })

  it('renders custom display elements and clones wrappers keyed by value', () => {
    const wrapper = <div data-testid="wrapped" />
    renderControl({
      options: [
        { value: 'one', display: <em data-testid="custom-display">One</em> },
        { value: 'two', wrapper },
        { value: 'three', displayText: 'Three!' },
      ],
    })
    expect(screen.getByTestId('custom-display').textContent).toBe('One')
    expect(screen.getByTestId('wrapped').querySelector('button')).not.toBeNull()
    expect(screen.getByText('Three!')).toBeDefined()
  })

  it('mounts the roving indicator over the selected option with the legacy fill, presets, and fast-curve transition', () => {
    renderControl()
    const indicator = getIndicator()
    expect(indicator.className).toContain('bg-surface3')
    expect(indicator.className).toContain('rounded-full')
    expect(indicator.className).toContain('z-10')
    expect(indicator.className).toContain('animate-spore-enter-fade-in')
    expect(indicator.className).toContain('data-exiting:animate-spore-exit-fade-out')
    // Position/size ride the legacy `fast` curve, ported byte-exact from the
    // legacy web driver config.
    for (const property of ['transform', 'width', 'height']) {
      expect(indicator.style.transition).toContain(`${property} ${SPORE_ANIMATION_CURVE_CSS.fast}`)
    }
    // No color transition (repo rule: scope transitions to non-color
    // properties; the hover fill switches per-frame like the native leg).
    expect(indicator.style.transition).not.toContain('background')
  })

  it('swaps the indicator fill to the hovered token under the pointer', () => {
    renderControl()
    fireEvent.mouseEnter(getIndicator())
    expect(getIndicator().className).toContain('bg-surface3-hovered')
    fireEvent.mouseLeave(getIndicator())
    expect(getIndicator().className).not.toContain('bg-surface3-hovered')
  })

  it('drops the hover fill when the pill leaves under the pointer, so a remount paints unhovered (native parity)', () => {
    const { rerender } = renderControl()
    fireEvent.mouseEnter(getIndicator())
    expect(getIndicator().className).toContain('bg-surface3-hovered')

    // Remove the selected option: the pill loses its measurement source and
    // exits while the pointer is still over it — its onMouseLeave never fires.
    rerender(
      <SegmentedControl<string>
        options={[{ value: 'two' }, { value: 'three' }]}
        selectedOption="one"
        onSelectOption={() => undefined}
      />,
    )
    rerender(<SegmentedControl<string> options={[...OPTIONS]} selectedOption="one" onSelectOption={() => undefined} />)
    expect(getIndicator().className).not.toContain('bg-surface3-hovered')
  })

  it('keeps working as a controlled component across selections', () => {
    function Harness(): JSX.Element {
      const [selected, setSelected] = useState('one')
      return <SegmentedControl options={OPTIONS} selectedOption={selected} onSelectOption={setSelected} />
    }
    render(<Harness />)
    fireEvent.click(getOption('three'))
    expect(getOption('three').getAttribute('aria-selected')).toBe('true')
    expect(getOption('one').getAttribute('aria-selected')).toBe('false')
  })

  it('places the pill from layout offsets, not ancestor-transformed client rects', () => {
    const optionBoxes: Record<string, Omit<FakeBox, 'offsetParent'>> = {
      one: { left: 4, top: 4, width: 42, height: 24 },
      two: { left: 54, top: 4, width: 36, height: 24 },
      three: { left: 98, top: 4, width: 36, height: 24 },
    }
    fakeLayout((el) => {
      if (el.getAttribute('role') === 'tablist') {
        return { left: 0, top: 0, width: 140, height: 34, clientLeft: 1, clientTop: 1, offsetParent: null }
      }
      const box = el.matches('button') ? optionBoxes[el.textContent] : undefined
      return box && { ...box, offsetParent: tablistOf(el) }
    })

    const { rerender } = renderControl({ selectedOption: 'two' })
    expect(getIndicator().style.width).toBe('36px')
    expect(getIndicator().style.height).toBe('24px')
    expect(getIndicator().style.transform).toBe('translate(54px, 4px)')

    rerender(<SegmentedControl options={OPTIONS} selectedOption="three" onSelectOption={() => undefined} />)
    expect(getIndicator().style.transform).toBe('translate(98px, 4px)')
  })

  it('sums the offset chain through a positioned wrapper up to the container', () => {
    fakeLayout((el) => {
      if (el.getAttribute('data-testid') === 'positioned-wrapper') {
        return { left: 48, top: 3, width: 40, height: 28, clientLeft: 1, clientTop: 1, offsetParent: tablistOf(el) }
      }
      if (el.matches('button') && el.textContent === 'two') {
        return { left: 2, top: 1, width: 36, height: 24, offsetParent: el.parentElement }
      }
      return undefined
    })

    renderControl({
      selectedOption: 'two',
      options: [{ value: 'one' }, { value: 'two', wrapper: <div data-testid="positioned-wrapper" /> }],
    })
    expect(getIndicator().style.transform).toBe('translate(51px, 5px)')
    expect(getIndicator().style.width).toBe('36px')
  })

  it('renders no pill while the selected option is not laid out under the container', () => {
    fakeLayout((el) =>
      el.matches('button') ? { left: 4, top: 4, width: 42, height: 24, offsetParent: null } : undefined,
    )
    renderControl()
    expect(screen.queryByTestId('segmented-control-indicator')).toBeNull()
  })

  it('applies container variants: outlined border, fullWidth, gap override, variableOptionWidths', () => {
    renderControl({ fullWidth: true, gap: '$spacing2', variableOptionWidths: true })
    const tablist = screen.getByRole('tablist')
    expect(tablist.className).toContain('border-surface3')
    expect(tablist.className).toContain('w-full')
    expect(tablist.className).toContain('gap-0.5')
    const option = getOption('one')
    expect(option.className).toContain('grow')
    expect(option.className).toContain('basis-auto')
    expect(option.className).not.toContain('flex-1')

    // fullWidth without variableOptionWidths uses the same longhands on web:
    // legacy's `flex: 1` resolves to basis auto under react-native-web, not
    // Yoga's basis-0 equal split (see the web leg's comment).
    renderControl({ fullWidth: true })
    const fullWidthOption = screen.getAllByText('one').at(-1)?.closest('button')
    expect(fullWidthOption?.className).toContain('grow')
    expect(fullWidthOption?.className).toContain('basis-auto')
    expect(fullWidthOption?.className).not.toContain('flex-1')

    renderControl({ outlined: false })
    const borderless = screen.getAllByRole('tablist').at(-1)
    expect(borderless?.className).toContain('border-0')
    expect(borderless?.className).not.toContain('border-surface3')
  })
})
