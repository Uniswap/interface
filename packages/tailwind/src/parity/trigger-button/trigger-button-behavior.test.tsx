// @vitest-environment jsdom
/**
 * Behavior contract for the trigger-button compat (INFRA-3021 dropdown set):
 * the legacy dropdown trigger chrome (`apps/web` TriggerButton +
 * NETWORK_FILTER_BUTTON_STYLES sizes + the Dropdown menuLabel/chevron
 * grammar) as a single compat component — sizes, outlined/active states,
 * the rotating chevron, disabled detachment, and the gated tooltip
 * stand-in. The chrome classes are literal constants; their CSS existence
 * is proven by the dropdown-set classes suite.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import { TRIGGER_BUTTON_SIZE_CLASS_NAMES, TriggerButtonCompat } from '../../../../mycelium/src/trigger-button-compat'

afterEach(cleanup)

const ROOT_SELECTOR = '[data-slot="trigger-button-compat"]'
const CHEVRON_SELECTOR = '[data-slot="trigger-chevron"]'

describe('TriggerButtonCompat — chrome + interaction', () => {
  it('renders children with the rotating chevron; the chevron flips while expanded', () => {
    const { rerender } = render(
      <TriggerButtonCompat isExpanded={false} onPress={() => undefined}>
        <span>All networks</span>
      </TriggerButtonCompat>,
    )
    expect(screen.getByText('All networks')).toBeTruthy()
    const chevron = document.querySelector(CHEVRON_SELECTOR) as HTMLElement
    const closedClassName = chevron.getAttribute('class') ?? ''
    rerender(
      <TriggerButtonCompat isExpanded onPress={() => undefined}>
        <span>All networks</span>
      </TriggerButtonCompat>,
    )
    const openClassName = (document.querySelector(CHEVRON_SELECTOR) as HTMLElement).getAttribute('class') ?? ''
    expect(openClassName).not.toBe(closedClassName)
    expect(openClassName).toContain('rotate-180')
  })

  it('applies the four legacy size presets (NETWORK_FILTER_BUTTON_STYLES heights)', () => {
    expect(TRIGGER_BUTTON_SIZE_CLASS_NAMES.large).toContain('h-[48px]')
    expect(TRIGGER_BUTTON_SIZE_CLASS_NAMES.medium).toContain('h-[40px]')
    expect(TRIGGER_BUTTON_SIZE_CLASS_NAMES.small).toContain('h-[32px]')
    expect(TRIGGER_BUTTON_SIZE_CLASS_NAMES.xsmall).toContain('h-[28px]')
    for (const size of ['large', 'medium', 'small', 'xsmall'] as const) {
      render(
        <TriggerButtonCompat size={size} isExpanded={false} onPress={() => undefined}>
          x
        </TriggerButtonCompat>,
      )
      const root = document.querySelector(ROOT_SELECTOR) as HTMLElement
      for (const cls of TRIGGER_BUTTON_SIZE_CLASS_NAMES[size].split(' ')) {
        expect(root.className, `size=${size} missing ${cls}`).toContain(cls)
      }
      cleanup()
    }
  })

  it('dispatches onPress on click and detaches while disabled', () => {
    const onPress = vi.fn()
    render(
      <TriggerButtonCompat isExpanded={false} onPress={onPress}>
        x
      </TriggerButtonCompat>,
    )
    fireEvent.click(document.querySelector(ROOT_SELECTOR) as HTMLElement)
    expect(onPress).toHaveBeenCalledTimes(1)
    cleanup()
    const onPressDisabled = vi.fn()
    render(
      <TriggerButtonCompat disabled isExpanded={false} onPress={onPressDisabled}>
        x
      </TriggerButtonCompat>,
    )
    fireEvent.click(document.querySelector(ROOT_SELECTOR) as HTMLElement)
    expect(onPressDisabled).not.toHaveBeenCalled()
  })

  it('outlined by default (surface1 + border); un-outlined is transparent; active paints surface2', () => {
    render(
      <TriggerButtonCompat isExpanded={false} onPress={() => undefined}>
        x
      </TriggerButtonCompat>,
    )
    expect((document.querySelector(ROOT_SELECTOR) as HTMLElement).className).toContain('bg-surface1')
    cleanup()
    render(
      <TriggerButtonCompat outlined={false} isExpanded={false} onPress={() => undefined}>
        x
      </TriggerButtonCompat>,
    )
    expect((document.querySelector(ROOT_SELECTOR) as HTMLElement).className).toContain('bg-transparent')
    cleanup()
    render(
      <TriggerButtonCompat active isExpanded={false} onPress={() => undefined}>
        x
      </TriggerButtonCompat>,
    )
    expect((document.querySelector(ROOT_SELECTOR) as HTMLElement).className).toContain('bg-surface2')
  })

  it('hides the chevron on demand and renders tooltipLabel as title + aria-label (gated stand-in)', () => {
    render(
      <TriggerButtonCompat hideChevron tooltipLabel="Ethereum" isExpanded={false} onPress={() => undefined}>
        x
      </TriggerButtonCompat>,
    )
    expect(document.querySelector(CHEVRON_SELECTOR)).toBeNull()
    const root = document.querySelector(ROOT_SELECTOR) as HTMLElement
    expect(root.getAttribute('title')).toBe('Ethereum')
    expect(root.getAttribute('aria-label')).toBe('Ethereum')
  })

  it('forwards testID and aria-expanded', () => {
    render(
      <TriggerButtonCompat testID="my-trigger" isExpanded onPress={() => undefined}>
        x
      </TriggerButtonCompat>,
    )
    const root = screen.getByTestId('my-trigger')
    expect(root.getAttribute('aria-expanded')).toBe('true')
  })
})

describe('trigger-button-compat platform legs — export parity', () => {
  it('the native leg exports every runtime symbol the web leg exports (bundler-resolution parity)', async () => {
    const [nativeLeg, webLeg] = await Promise.all([
      import('../../../../mycelium/src/trigger-button-compat/index.native'),
      import('../../../../mycelium/src/trigger-button-compat/index.web'),
    ])
    expect(Object.keys(nativeLeg).sort()).toEqual(Object.keys(webLeg).sort())
    // Size class map is pure data — real on native.
    expect(nativeLeg.TRIGGER_BUTTON_SIZE_CLASS_NAMES).toEqual(webLeg.TRIGGER_BUTTON_SIZE_CLASS_NAMES)
    expect(() => (nativeLeg.TriggerButtonCompat as () => never)()).toThrow(/web-only/)
  })
})
