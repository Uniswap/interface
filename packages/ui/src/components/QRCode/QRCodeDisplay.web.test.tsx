/**
 * Behavior pins for the Tamagui-free QRCodeDisplay web leg (INFRA-3637):
 * container color resolution (token vs raw color, per theme), the centering
 * container, and the absolutely-positioned children overlay the legacy
 * Tamagui Flex pair produced — now emitted as FlexCompat Tailwind classes.
 */
import { render, type RenderResult } from '@testing-library/react'
import { colorsDark, colorsLight } from '@universe/mycelium/theme-palette'
import type { ReactNode } from 'react'
import { QRCodeDisplay } from 'ui/src/components/QRCode/QRCodeDisplay'
import { afterEach, describe, expect, it } from 'vitest'

type ThemeName = 'light' | 'dark'

function renderThemed(theme: ThemeName, children: ReactNode): RenderResult {
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(theme)
  return render(children)
}

afterEach(() => {
  document.documentElement.classList.remove('light', 'dark')
})

function getContainer(tree: RenderResult): HTMLElement {
  const container = tree.container.firstElementChild
  if (!(container instanceof HTMLElement)) {
    throw new Error('QRCodeDisplay did not render an element')
  }
  return container
}

/** Whole-class membership (substring matching would let `relative` match `-relative-` variants). */
function classListOf(element: HTMLElement): string[] {
  return element.className.split(' ')
}

/**
 * FlexCompat carries an out-of-set backgroundColor through the var-indirection
 * lane: a safelisted `bg-[color:var(--c-bg)]` class reading an inline `--c-bg`
 * custom property that holds the resolved value verbatim.
 */
function containerBackground(element: HTMLElement): string {
  return element.style.getPropertyValue('--c-bg')
}

describe('QRCodeDisplay (web)', () => {
  it('renders the QR code svg with the children overlay centered on top', () => {
    const tree = renderThemed(
      'light',
      <QRCodeDisplay color="#FF00FF" encodedValue="uniswap" size={100}>
        <span data-testid="overlay-child">logo</span>
      </QRCodeDisplay>,
    )

    const container = getContainer(tree)
    // The test environment renders react-native-svg through its mock (divs
    // carrying the svg attributes), so pin the QR root by its viewBox.
    expect(container.querySelector('[viewbox]')).not.toBeNull()
    const containerClasses = classListOf(container)
    expect(containerClasses).toContain('relative')
    expect(containerClasses).toContain('flex')
    expect(containerClasses).toContain('items-center')
    expect(containerClasses).toContain('justify-center')
    // Legacy Flex default: without it a height-constrained flex-column
    // parent shrinks the container below the fixed-size SVG and the overlay
    // drifts off-center.
    expect(containerClasses).toContain('shrink-0')
    // The container carries no background unless one is passed.
    expect(containerBackground(container)).toBe('')
    expect(containerClasses.some((cls) => cls.startsWith('bg-'))).toBe(false)

    const overlay = container.lastElementChild as HTMLElement
    const overlayClasses = classListOf(overlay)
    expect(overlayClasses).toContain('absolute')
    expect(overlayClasses).toContain('shrink-0')
    expect(overlayClasses).toContain('items-center')
    expect(overlayClasses).toContain('justify-center')
    expect(overlayClasses).toContain('bg-transparent')
    expect(overlay.querySelector('[data-testid="overlay-child"]')).not.toBeNull()
  })

  it.each([
    ['light', colorsLight.surface1],
    ['dark', colorsDark.surface1],
  ] as const)('resolves a $surface1 container color through the %s theme', (theme, expected) => {
    const tree = renderThemed(
      theme,
      <QRCodeDisplay color="#FF00FF" containerBackgroundColor="$surface1" encodedValue="uniswap" size={100} />,
    )

    const container = getContainer(tree)
    expect(classListOf(container)).toContain('bg-[color:var(--c-bg)]')
    expect(containerBackground(container)).toBe(expected)
  })

  it('passes an already-resolved color through verbatim', () => {
    const tree = renderThemed(
      'light',
      <QRCodeDisplay color="#FF00FF" containerBackgroundColor="#123456" encodedValue="uniswap" size={100} />,
    )

    const container = getContainer(tree)
    expect(classListOf(container)).toContain('bg-[color:var(--c-bg)]')
    expect(containerBackground(container)).toBe('#123456')
  })
})
