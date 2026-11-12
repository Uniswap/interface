import { act, fireEvent, render, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type JSX, type ReactNode, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LIGHT_THEME_COLORS } from '../theme-hooks-compat/tokens'
import type { SwitchCompatProps } from './props'
import { SwitchCompat as Switch } from './SwitchCompat.web'

type ThemeColorName = keyof typeof LIGHT_THEME_COLORS

/** useSporeColors reads the root `light`/`dark` class; cleared after each test so no theme leaks. */
function renderLight(children: ReactNode): RenderResult {
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add('light')
  return render(children)
}

afterEach(() => {
  document.documentElement.classList.remove('light', 'dark')
})

describe('SwitchCompat (web) keeps its own size inside a stretching flex row', () => {
  /**
   * The settings-row shape that regressed: `align-items: stretch` on a row whose text wraps.
   * jsdom does not lay out, so the pin is on the declared cross-size — a `min-height` floor
   * alone is what let the row stretch the toggle to the label's height.
   */
  it('a multi-line label row cannot stretch the track past 32x60', () => {
    const { container } = renderLight(
      <div style={{ display: 'flex', flexDirection: 'row', width: 320 }}>
        <span>
          Allow this site to see your wallet address and suggest transactions, and to keep doing so on every subsequent
          visit until you revoke it here.
        </span>
        <Switch checked variant="branded" testID="subject" />
      </div>,
    )
    const resolved = window.getComputedStyle(getParts(container).track)
    expect(resolved.height, 'resolved track height').toBe('32px')
    expect(resolved.width, 'resolved track width').toBe('60px')
    expect(resolved.flexShrink, 'resolved track flex-shrink').toBe('0')
  })
})

describe('SwitchCompat (web) behavior', () => {
  it('uncontrolled: click toggles state and reports through onCheckedChange', () => {
    const onCheckedChange = vi.fn()
    const { container } = renderLight(<Switch variant="default" onCheckedChange={onCheckedChange} testID="subject" />)
    const { track } = getParts(container)

    expect(track.getAttribute('aria-checked')).toBe('false')
    fireEvent.click(track)
    expect(track.getAttribute('aria-checked')).toBe('true')
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)
    fireEvent.click(track)
    expect(track.getAttribute('aria-checked')).toBe('false')
    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
  })

  it('uncontrolled: defaultChecked seeds the initial state', () => {
    const { container } = renderLight(<Switch defaultChecked variant="default" testID="subject" />)
    expect(getParts(container).track.getAttribute('aria-checked')).toBe('true')
  })

  it('controlled: click reports the next value but only the checked prop moves the state', () => {
    const onCheckedChange = vi.fn()
    const { container, rerender } = renderLight(
      <Switch checked={false} variant="default" onCheckedChange={onCheckedChange} testID="subject" />,
    )
    const { track } = getParts(container)

    fireEvent.click(track)
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)
    // no state change until the owner echoes the prop back
    expect(track.getAttribute('aria-checked')).toBe('false')

    rerender(<Switch checked={true} variant="default" onCheckedChange={onCheckedChange} testID="subject" />)
    expect(track.getAttribute('aria-checked')).toBe('true')
  })

  it('controlled: works end-to-end with a stateful owner', () => {
    function Owner(): JSX.Element {
      const [checked, setChecked] = useState(false)
      return <Switch checked={checked} variant="default" testID="subject" onCheckedChange={setChecked} />
    }
    const { container } = renderLight(<Owner />)
    const { track } = getParts(container)
    fireEvent.click(track)
    expect(track.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(track)
    expect(track.getAttribute('aria-checked')).toBe('false')
  })

  it('keyboard: space and enter toggle the focused switch', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    const { container } = renderLight(<Switch variant="default" onCheckedChange={onCheckedChange} testID="subject" />)
    const { track } = getParts(container)

    await user.tab()
    expect(document.activeElement, 'native button is keyboard-focusable').toBe(track)

    await user.keyboard(' ')
    expect(track.getAttribute('aria-checked'), 'space toggles on').toBe('true')
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)

    await user.keyboard('{Enter}')
    expect(track.getAttribute('aria-checked'), 'enter toggles off').toBe('false')
    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
  })

  it('disabled: no toggle from click or keyboard, and the tree is inert to pointers', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    const { container } = renderLight(
      <Switch disabled checked={false} variant="default" onCheckedChange={onCheckedChange} testID="subject" />,
    )
    const { track } = getParts(container)

    fireEvent.click(track)
    await user.keyboard(' ')
    expect(onCheckedChange).not.toHaveBeenCalled()
    expect(track.getAttribute('aria-checked')).toBe('false')
    expect(track.getAttribute('aria-disabled')).toBe('true')
    expect(track.style.pointerEvents).toBe('none')
  })

  it('focus ring: both ring layers appear on focus and clear on blur', () => {
    const ringCases: { props: SwitchCompatProps; outer: ThemeColorName }[] = [
      // accent1Hovered only for checked+branded
      { props: { checked: true, variant: 'branded' }, outer: 'accent1Hovered' },
      { props: { checked: false, variant: 'branded' }, outer: 'neutral3Hovered' },
      { props: { checked: true, variant: 'default' }, outer: 'neutral3Hovered' },
      { props: { checked: false, variant: 'default' }, outer: 'neutral3Hovered' },
    ]
    for (const { props, outer } of ringCases) {
      const { container, unmount } = renderLight(<Switch {...props} testID="subject" />)
      const { track, outerRing, innerRing } = getParts(container)

      expect(outerRing.style.borderColor, 'outer ring at rest').toBe('transparent')
      expect(innerRing.style.borderColor, 'inner ring at rest').toBe('transparent')

      act(() => track.focus())
      expect(outerRing.style.borderColor, `outer ring ${JSON.stringify(props)}`).toBe(
        cssBorderColor(LIGHT_THEME_COLORS[outer]),
      )
      expect(innerRing.style.borderColor, 'inner ring is surface1').toBe(cssBorderColor(LIGHT_THEME_COLORS.surface1))
      expect(outerRing.style.borderWidth, 'outer ring width').toBe('1px')
      expect(innerRing.style.borderWidth, 'inner ring width').toBe('2px')
      expect(outerRing.style.pointerEvents, 'rings never intercept').toBe('none')

      act(() => track.blur())
      expect(outerRing.style.borderColor, 'outer ring after blur').toBe('transparent')
      expect(innerRing.style.borderColor, 'inner ring after blur').toBe('transparent')
      unmount()
    }
  })

  it('press without hover stretches the thumb but never recolors the track', () => {
    const pressCases: { props: SwitchCompatProps; track: ThemeColorName; shift: string }[] = [
      // a hoverless touch tap: the thumb stretches on press, the track recolors only on hover
      { props: { checked: false, variant: 'default' }, track: 'neutral3', shift: 'translateX(0px)' },
      { props: { checked: true, variant: 'branded' }, track: 'accent1', shift: 'translateX(-4px)' },
    ]
    for (const { props, track: trackToken, shift } of pressCases) {
      const { container, unmount } = renderLight(<Switch {...props} testID="subject" />)
      const { track, fakeThumb } = getParts(container)

      fireEvent.pointerDown(track)
      expect(track.style.backgroundColor, `track keeps rest color ${JSON.stringify(props)}`).toBe(
        cssColor(LIGHT_THEME_COLORS[trackToken]),
      )
      expect(fakeThumb.style.width, 'thumb stretches on press').toBe('28px')
      expect(fakeThumb.style.transform, 'stretched pill pins its right edge when checked').toBe(shift)

      fireEvent.pointerUp(track)
      expect(fakeThumb.style.width, 'thumb rests after release').toBe('24px')
      expect(track.style.backgroundColor, 'track color untouched across the tap').toBe(
        cssColor(LIGHT_THEME_COLORS[trackToken]),
      )
      unmount()
    }
  })

  it('backgroundColor override wins at rest; hover still recolors', () => {
    const { container } = renderLight(
      <Switch backgroundColor="$statusCritical" checked={false} variant="default" testID="subject" />,
    )
    const { track } = getParts(container)
    expect(track.style.backgroundColor).toBe(cssColor(LIGHT_THEME_COLORS.statusCritical))
    fireEvent.mouseEnter(track)
    expect(track.style.backgroundColor).toBe(cssColor(LIGHT_THEME_COLORS.neutral3Hovered))
  })

  it('pointerEvents="none" makes an enabled switch inert (SettingsBiometricModal contract)', () => {
    const { container } = renderLight(<Switch pointerEvents="none" variant="default" testID="subject" />)
    expect(getParts(container).track.style.pointerEvents).toBe('none')
  })

  it('forwards id, testID, accessible name and description to the switch element', () => {
    const { getByTestId } = renderLight(
      <Switch
        aria-label="Lock leverage"
        aria-describedby="switch-description"
        id="switch-id"
        variant="default"
        testID="switch-test-id"
      />,
    )
    const track = getByTestId('switch-test-id')
    expect(track.getAttribute('id')).toBe('switch-id')
    expect(track.getAttribute('aria-label')).toBe('Lock leverage')
    expect(track.getAttribute('aria-describedby')).toBe('switch-description')
    expect(track.getAttribute('role')).toBe('switch')
    expect((track as HTMLButtonElement).type, 'type=button so it never submits forms').toBe('button')
  })

  it('disabledStyle applies only while disabled', () => {
    const { container, rerender } = renderLight(
      <Switch disabled checked={true} variant="default" disabledStyle={{ opacity: 0.3 }} testID="subject" />,
    )
    const { track } = getParts(container)
    // merged after the checked opacity, so the consumer value wins
    expect(track.style.opacity).toBe('0.3')
    rerender(<Switch checked={true} variant="default" disabledStyle={{ opacity: 0.3 }} testID="subject" />)
    expect(track.style.opacity).toBe('')
  })
})

function getParts(container: HTMLElement): {
  track: HTMLElement
  fakeThumb: HTMLElement
  outerRing: HTMLElement
  innerRing: HTMLElement
} {
  const track = container.querySelector('button[role="switch"]') as HTMLElement
  const thumb = track.children[0] as HTMLElement
  const fakeThumb = thumb.children[1] as HTMLElement
  const outerRing = track.children[1] as HTMLElement
  const innerRing = track.children[2] as HTMLElement
  return { track, fakeThumb, outerRing, innerRing }
}

/** jsdom normalizes inline-style colors (hex → rgb), so round-trip expected values through the CSSOM. */
function cssColor(value: string): string {
  const probe = document.createElement('div')
  probe.style.color = value
  return probe.style.color
}

/** jsdom stores `borderColor` verbatim, so round-trip through the same property. */
function cssBorderColor(value: string): string {
  const probe = document.createElement('div')
  probe.style.borderColor = value
  return probe.style.borderColor
}
