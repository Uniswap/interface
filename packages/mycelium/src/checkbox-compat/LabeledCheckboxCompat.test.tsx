/**
 * Behavior contract for the `LabeledCheckboxCompat` web leg (INFRA-3233).
 *
 * The load-bearing pin is `onCheckPressed`: it receives the PRE-TOGGLE state
 * and every call site inverts it itself, so a negation here is a silent
 * inversion that no typecheck catches.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
// Type-only — react-native runtime imports are banned outside .native legs.
import type { ViewStyle } from 'react-native'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetWebStyleWarnings } from '../compat/web-diagnostics'
import { LabeledCheckboxCompat } from './LabeledCheckboxCompat'

afterEach(cleanup)

function container(): HTMLElement {
  return screen.getByTestId('labeled')
}

function row(): HTMLElement {
  const first = container().firstElementChild
  if (first === null) {
    throw new Error('row not rendered')
  }
  return first as HTMLElement
}

function checkbox(): HTMLElement {
  return screen.getByRole('checkbox')
}

describe('onCheckPressed receives the PRE-TOGGLE state', () => {
  it('passes false while unchecked', () => {
    const onCheckPressed = vi.fn()
    render(<LabeledCheckboxCompat checked={false} testID="labeled" onCheckPressed={onCheckPressed} />)
    fireEvent.click(checkbox())
    expect(onCheckPressed).toHaveBeenCalledWith(false)
  })

  it('passes true while checked — the current state, never the next one', () => {
    const onCheckPressed = vi.fn()
    render(<LabeledCheckboxCompat checked testID="labeled" onCheckPressed={onCheckPressed} />)
    fireEvent.click(checkbox())
    expect(onCheckPressed).toHaveBeenCalledWith(true)
    expect(onCheckPressed).not.toHaveBeenCalledWith(false)
  })

  it('fires from a press on the row too, with the same pre-toggle argument', () => {
    const onCheckPressed = vi.fn()
    render(<LabeledCheckboxCompat checked text="Label" testID="labeled" onCheckPressed={onCheckPressed} />)
    fireEvent.click(container())
    expect(onCheckPressed).toHaveBeenCalledWith(true)
  })

  it('a press on the checkbox stops propagation, so the container does not double-fire', () => {
    const onCheckPressed = vi.fn()
    render(<LabeledCheckboxCompat checked={false} text="Label" testID="labeled" onCheckPressed={onCheckPressed} />)
    fireEvent.click(checkbox())
    expect(onCheckPressed).toHaveBeenCalledTimes(1)
  })
})

describe('checkedColor is accepted and ignored, exactly like legacy', () => {
  it('produces byte-identical markup with and without it', () => {
    const without = render(<LabeledCheckboxCompat checked text="Label" testID="labeled" />)
    const baseline = container().outerHTML
    without.unmount()
    render(<LabeledCheckboxCompat checked checkedColor="$neutral1" text="Label" testID="labeled" />)
    expect(container().outerHTML).toBe(baseline)
  })

  it('does not leak the token into any class or inline style', () => {
    render(<LabeledCheckboxCompat checked checkedColor="$accent1" text="Label" testID="labeled" />)
    expect(container().outerHTML).not.toContain('neutral1-')
    expect(container().outerHTML).not.toContain('$accent1')
    expect(container().outerHTML).not.toContain('accent1')
  })
})

describe('all four real `text` shapes', () => {
  it('wraps a plain string in the subheading2 label (6 call sites)', () => {
    render(<LabeledCheckboxCompat checked={false} text="Do not show again" testID="labeled" />)
    const label = screen.getByText('Do not show again')
    expect(label.tagName).toBe('SPAN')
    expect(label.className).toContain('text-subheading-2')
    expect(label.className).toContain('text-neutral1')
  })

  it('passes a <Text>-shaped element through untouched (8 call sites)', () => {
    render(
      <LabeledCheckboxCompat
        checked={false}
        testID="labeled"
        text={<span data-testid="passthrough">Do not show again</span>}
      />,
    )
    const passed = screen.getByTestId('passthrough')
    expect(passed.className).toBe('')
    expect(passed.parentElement?.className).toContain('grow')
  })

  it('passes a <Flex>-shaped element (a wrapper with two children) through (2 call sites)', () => {
    render(
      <LabeledCheckboxCompat
        checked={false}
        testID="labeled"
        text={
          <div data-testid="flex-text">
            <span>Line one</span>
            <span>Line two</span>
          </div>
        }
      />,
    )
    expect(screen.getByTestId('flex-text').children.length).toBe(2)
  })

  it('renders no label wrapper at all when text is absent (BackupSpeedBumpModal)', () => {
    render(<LabeledCheckboxCompat checked={false} testID="labeled" />)
    expect(row().children.length).toBe(1)
    expect(row().querySelector('.grow')).toBeNull()
  })
})

describe('checkboxPosition', () => {
  it("'start' (the default) puts the checkbox before the label", () => {
    render(<LabeledCheckboxCompat checked={false} text="Label" testID="labeled" />)
    expect(row().children.length).toBe(2)
    expect(row().children[0]?.contains(checkbox())).toBe(true)
  })

  it("'end' puts the checkbox after the label (PositionsHeader, positionsFilters)", () => {
    render(<LabeledCheckboxCompat checkboxPosition="end" checked={false} text="Label" testID="labeled" />)
    expect(row().children.length).toBe(2)
    expect(row().children[1]?.contains(checkbox())).toBe(true)
    expect(row().children[0]?.contains(checkbox())).toBe(false)
  })

  it('renders exactly one checkbox in either position', () => {
    render(<LabeledCheckboxCompat checkboxPosition="end" checked={false} text="Label" testID="labeled" />)
    expect(screen.getAllByRole('checkbox').length).toBe(1)
  })
})

describe('gap / px / py', () => {
  it('applies the legacy defaults ($spacing12 gap, $spacing4 px, no py)', () => {
    render(<LabeledCheckboxCompat checked={false} text="Label" testID="labeled" />)
    expect(row().className).toContain('gap-3')
    expect(row().className).toContain('px-1')
    expect(row().className).not.toMatch(/\bpy-/)
  })

  it('honours explicit space tokens, including $none (3 call sites pass px="$none")', () => {
    render(<LabeledCheckboxCompat checked={false} gap="$spacing8" px="$none" py="$spacing4" testID="labeled" />)
    expect(row().className).toContain('gap-2')
    expect(row().className).toContain('px-0')
    expect(row().className).toContain('py-1')
  })

  it('routes an open-domain numeric value to the inline style lane, not a class', () => {
    render(<LabeledCheckboxCompat checked={false} gap={7} testID="labeled" />)
    expect(row().className).not.toMatch(/\bgap-/)
    expect(row().style.gap).toBe('7px')
  })
})

describe('hoverStyle is opt-in (legacy `hoverable={!!hoverStyle}`)', () => {
  it('applies only while hovered, and only when hoverStyle was passed', () => {
    render(
      <LabeledCheckboxCompat
        checked={false}
        hoverStyle={{ opacity: 0.8, backgroundColor: 'unset' }}
        text="Label"
        testID="labeled"
      />,
    )
    expect(container().style.opacity).toBe('')
    fireEvent.mouseEnter(container())
    expect(container().style.opacity).toBe('0.8')
    fireEvent.mouseLeave(container())
    expect(container().style.opacity).toBe('')
  })

  it('tracks no hover state at all when hoverStyle is absent', () => {
    render(<LabeledCheckboxCompat checked={false} text="Label" testID="labeled" />)
    fireEvent.mouseEnter(container())
    expect(container().getAttribute('style')).toBeNull()
  })
})

describe('containerStyle and testID', () => {
  it('applies containerStyle to the container (PositionsHeader passes {flex: 1})', () => {
    render(<LabeledCheckboxCompat checked={false} containerStyle={{ flex: 1 }} testID="labeled" />)
    expect(container().style.flex).toBe('1')
  })

  it('merges hoverStyle over containerStyle while hovered', () => {
    render(
      <LabeledCheckboxCompat
        checked={false}
        containerStyle={{ flex: 1, opacity: 1 }}
        hoverStyle={{ opacity: 0.8 }}
        testID="labeled"
      />,
    )
    fireEvent.mouseEnter(container())
    expect(container().style.flex).toBe('1')
    expect(container().style.opacity).toBe('0.8')
  })

  it('renders testID as data-testid on the container', () => {
    render(<LabeledCheckboxCompat checked={false} testID="labeled" />)
    expect(container()).not.toBeNull()
  })

  // `containerStyle` admits arrays and falsy entries, and React drops an array
  // silently — no warning, no style attribute at all — where RN flattens it.
  it('flattens an ARRAY containerStyle instead of dropping it', () => {
    render(<LabeledCheckboxCompat checked={false} containerStyle={[{ flex: 1 }, { opacity: 0.5 }]} testID="labeled" />)
    expect(container().style.flex).toBe('1')
    expect(container().style.opacity).toBe('0.5')
  })

  it('applies array entries left-to-right, later entries winning', () => {
    render(
      <LabeledCheckboxCompat checked={false} containerStyle={[{ opacity: 0.2 }, { opacity: 0.9 }]} testID="labeled" />,
    )
    expect(container().style.opacity).toBe('0.9')
  })

  it('skips falsy array entries, exactly as StyleSheet.flatten does', () => {
    render(
      <LabeledCheckboxCompat checked={false} containerStyle={[false, null, { flex: 1 }, undefined]} testID="labeled" />,
    )
    expect(container().style.flex).toBe('1')
  })

  it('flattens NESTED arrays', () => {
    render(
      <LabeledCheckboxCompat checked={false} containerStyle={[[{ flex: 1 }], [[{ opacity: 0.5 }]]]} testID="labeled" />,
    )
    expect(container().style.flex).toBe('1')
    expect(container().style.opacity).toBe('0.5')
  })

  it('still merges hoverStyle over an ARRAY containerStyle while hovered', () => {
    render(
      <LabeledCheckboxCompat
        checked={false}
        containerStyle={[{ flex: 1 }, { opacity: 1 }]}
        hoverStyle={{ opacity: 0.8 }}
        testID="labeled"
      />,
    )
    fireEvent.mouseEnter(container())
    expect(container().style.flex).toBe('1')
    expect(container().style.opacity).toBe('0.8')
  })
})

/**
 * `containerStyle` flattens through the pair's own `flattenStyleProp`, NOT
 * `mergeCompatStyle`, so this leg wires `warnUnsupportedWebStyleKeys`
 * explicitly; this block keeps it wired (INFRA-3509 review run 3).
 */
describe('RN-only containerStyle keys dev-warn on the web leg', () => {
  beforeEach(() => {
    __resetWebStyleWarnings()
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('warns for an RN-only key inside a flattened ARRAY containerStyle', () => {
    render(<LabeledCheckboxCompat checked={false} containerStyle={[{ flex: 1 }, { elevation: 4 }]} testID="labeled" />)
    const warned = vi
      .mocked(console.warn)
      .mock.calls.map((call) => String(call[0]))
      .join('\n')
    expect(warned).toContain('"elevation"')
  })

  it('stays silent for plain CSS keys', () => {
    render(<LabeledCheckboxCompat checked={false} containerStyle={{ flex: 1 }} testID="labeled" />)
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('warns when a RegisteredStyle id is dropped from containerStyle (wired next to the RN-only-key warning)', () => {
    render(
      <LabeledCheckboxCompat
        checked={false}
        containerStyle={[7 as unknown as ViewStyle, { flex: 1 }]}
        testID="labeled"
      />,
    )
    const warned = vi
      .mocked(console.warn)
      .mock.calls.map((call) => String(call[0]))
      .join('\n')
    expect(warned).toContain('RegisteredStyle id (7)')
  })
})

describe('hoverStyle token validation happens at render, not on first hover', () => {
  // Behind the `hoverable && hovered` guard a bad token mounts cleanly and then
  // throws mid-interaction — an exception attributed to a hover, not to the
  // props that caused it.
  it('throws while RENDERING a `$`-token hoverStyle, before any hover', () => {
    expect(() =>
      render(<LabeledCheckboxCompat checked={false} hoverStyle={{ backgroundColor: '$neutral2' }} testID="labeled" />),
    ).toThrow(/hoverStyle\.backgroundColor/)
  })

  it('names the offending prop and value so the call site is findable', () => {
    expect(() =>
      render(<LabeledCheckboxCompat checked={false} hoverStyle={{ opacity: '$spacing8' }} testID="labeled" />),
    ).toThrow(/hoverStyle\.opacity = "\$spacing8"/)
  })

  it('a resolved hoverStyle still mounts and still applies on hover', () => {
    render(<LabeledCheckboxCompat checked={false} hoverStyle={{ opacity: 0.8 }} testID="labeled" />)
    expect(container().style.opacity).toBe('')
    fireEvent.mouseEnter(container())
    expect(container().style.opacity).toBe('0.8')
  })
})

describe('size and variant thread through to the checkbox', () => {
  it('forwards size (CompatibleAddressModal passes $icon.16)', () => {
    render(<LabeledCheckboxCompat checked={false} size="$icon.16" testID="labeled" />)
    expect(checkbox().className).toContain('h-[16px]')
  })

  it('forwards variant', () => {
    render(<LabeledCheckboxCompat checked size="$icon.20" testID="labeled" variant="branded" />)
    expect(checkbox().querySelector('.bg-accent1')).not.toBeNull()
  })
})

describe("a11y: the container keeps legacy's nested interactive role", () => {
  it('the container is announced as a button', () => {
    render(<LabeledCheckboxCompat checked={false} text="Label" testID="labeled" />)
    expect(container().getAttribute('role')).toBe('button')
    expect(screen.getByRole('button')).toBe(container())
  })

  it('the container is in the tab order, exactly as legacy is', () => {
    render(<LabeledCheckboxCompat checked={false} text="Label" testID="labeled" />)
    expect(container().getAttribute('tabindex')).toBe('0')
  })

  it('the checkbox stays nested INSIDE that button, keeping its own role and checked state', () => {
    render(<LabeledCheckboxCompat checked text="Label" testID="labeled" />)
    const button = screen.getByRole('button')
    const box = screen.getByRole('checkbox')
    expect(button.contains(box)).toBe(true)
    expect(box).not.toBe(button)
    expect(box.getAttribute('aria-checked')).toBe('true')
  })

  it('announces exactly one button and one checkbox — no extra roles, no flattening', () => {
    render(<LabeledCheckboxCompat checked={false} text="Label" testID="labeled" />)
    expect(screen.getAllByRole('button').length).toBe(1)
    expect(screen.getAllByRole('checkbox').length).toBe(1)
  })
})
