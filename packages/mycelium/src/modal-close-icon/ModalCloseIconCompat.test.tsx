/**
 * Behavior contract for the `ModalCloseIcon` compat web leg (INFRA-3282),
 * asserted on the rendered DOM. The legacy reference is
 * `ui/src/components/modal/AdaptiveWebModal.tsx` (`ModalCloseIcon`).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { X } from '../components/icons/X'
import { LIGHT_THEME_COLORS } from '../theme-hooks-compat/tokens'
import { ModalCloseIconCompat } from './ModalCloseIconCompat'
import { resolveCloseIconColor } from './resolve'

const harness = vi.hoisted(() => ({ isWebApp: false, sm: false }))

// The media gate reads `isWebApp` (build-time constant per app) and
// `useMedia().sm` (a matchMedia subscription jsdom does not implement); both
// are swapped for controllable values so every gate arm is exercisable.
vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isWebApp() {
      return harness.isWebApp
    },
  }
})

vi.mock('../theme-hooks-compat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../theme-hooks-compat')>()
  return {
    ...actual,
    useMedia: () => ({ sm: harness.sm }),
  }
})

afterEach(() => {
  cleanup()
  harness.isWebApp = false
  harness.sm = false
})

function renderCloseIcon(onClose: () => void = (): void => {}): HTMLElement {
  render(<ModalCloseIconCompat testId="modal-close" role="none" onClose={onClose} />)
  return screen.getByTestId('modal-close')
}

function svgOf(frame: HTMLElement): SVGSVGElement {
  const svg = frame.querySelector('svg')
  if (svg === null) {
    throw new Error('X glyph not rendered')
  }
  return svg
}

describe('legacy prop surface', () => {
  it('forwards testId as data-testid and role onto the touchable frame', () => {
    const frame = renderCloseIcon()
    expect(frame.getAttribute('role')).toBe('none')
  })

  it('fires onClose exactly once per press', () => {
    const onClose = vi.fn()
    const frame = renderCloseIcon(onClose)
    fireEvent.click(frame)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('defaults role to button, like legacy', () => {
    render(<ModalCloseIconCompat testId="defaulted" onClose={(): void => {}} />)
    expect(screen.getByTestId('defaulted').getAttribute('role')).toBe('button')
  })
})

describe('the X glyph', () => {
  it('renders the mycelium X icon', () => {
    const rendered = svgOf(renderCloseIcon())
    const { container } = render(<X size={24} color="#000000" />)
    expect(rendered.querySelector('path')?.getAttribute('d')).toBe(container.querySelector('path')?.getAttribute('d'))
    expect(rendered.getAttribute('viewBox')).toBe(container.querySelector('svg')?.getAttribute('viewBox'))
  })

  it('sizes to the legacy $icon.24 default', () => {
    const svg = svgOf(renderCloseIcon())
    expect(svg.style.width).toBe('24px')
    expect(svg.style.height).toBe('24px')
  })
})

describe('hover color (legacy CloseIconWithHover behavior)', () => {
  it('renders neutral2 at rest and neutral2Hovered while hovered', () => {
    const frame = renderCloseIcon()
    const svg = svgOf(frame)
    expect(svg.style.color).toBe(LIGHT_THEME_COLORS.neutral2)
    fireEvent.mouseEnter(svg)
    expect(svgOf(frame).style.color).toBe(LIGHT_THEME_COLORS.neutral2Hovered)
    fireEvent.mouseLeave(svg)
    expect(svgOf(frame).style.color).toBe(LIGHT_THEME_COLORS.neutral2)
  })
})

describe('the adaptive-modal media gate', () => {
  it('hides on the web app below the sm breakpoint (bottom-sheet adaptation)', () => {
    harness.isWebApp = true
    harness.sm = true
    const { container } = render(<ModalCloseIconCompat testId="hidden" onClose={(): void => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders on the web app above sm', () => {
    harness.isWebApp = true
    harness.sm = false
    render(<ModalCloseIconCompat testId="visible" onClose={(): void => {}} />)
    expect(screen.getByTestId('visible')).toBeTruthy()
  })

  it('renders below sm when the app is not the web app (extension parity)', () => {
    harness.isWebApp = false
    harness.sm = true
    render(<ModalCloseIconCompat testId="visible-sm" onClose={(): void => {}} />)
    expect(screen.getByTestId('visible-sm')).toBeTruthy()
  })
})

describe('color resolution', () => {
  const colorsStub = {
    $neutral2: { val: '#111111', variable: 'var(--neutral2)', get: (): string => 'var(--neutral2)' },
  } as unknown as Parameters<typeof resolveCloseIconColor>[1]

  it('resolves $-tokens through the theme map', () => {
    expect(resolveCloseIconColor('$neutral2', colorsStub)).toBe('#111111')
  })

  it('passes raw CSS colors through unchanged', () => {
    expect(resolveCloseIconColor('rgba(0,0,0,0.5)', colorsStub)).toBe('rgba(0,0,0,0.5)')
  })

  it('throws on a $-token outside the theme map instead of reaching the leaf raw', () => {
    expect(() => resolveCloseIconColor('$definitelyNotAToken', colorsStub)).toThrow('$definitelyNotAToken')
  })
})
