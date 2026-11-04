/**
 * Behavior pins for the Tamagui-free QRCodeDisplay native leg, mirroring
 * QRCodeDisplay.web.test.tsx (the two legs are hand-maintained twins):
 * container centering, the absolutely-positioned children overlay, and
 * container color resolution (token vs raw color, per theme).
 *
 * jsdom resolves `.web` platform legs, so the leg under test is imported by
 * explicit path (AnimatedFlex/Coachmark native-test precedent) and renders
 * through react-native-web. RNW emits atomic classes rather than inline
 * styles, so assertions go through getComputedStyle (Coachmark precedent).
 */
import { render, type RenderResult } from '@testing-library/react'
import { colorsDark, colorsLight } from '@universe/mycelium/theme-palette'
import type { ReactNode } from 'react'
import { QRCodeDisplay } from 'ui/src/components/QRCode/QRCodeDisplay.native'
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

/** jsdom normalizes CSS colors (hex → rgb) — round-trip expected values through the same CSSOM. */
function cssColor(value: string): string {
  const probe = document.createElement('div')
  probe.style.color = value
  return probe.style.color
}

function getContainer(tree: RenderResult): HTMLElement {
  const container = tree.container.firstElementChild
  if (!(container instanceof HTMLElement)) {
    throw new Error('QRCodeDisplay did not render an element')
  }
  return container
}

describe('QRCodeDisplay (native)', () => {
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
    const containerStyle = window.getComputedStyle(container)
    expect(containerStyle.position).toBe('relative')
    expect(containerStyle.alignItems).toBe('center')
    expect(containerStyle.justifyContent).toBe('center')
    // The container carries no background unless one is passed.
    expect(['', 'transparent', 'rgba(0, 0, 0, 0)']).toContain(containerStyle.backgroundColor)

    const overlay = container.lastElementChild as HTMLElement
    const overlayStyle = window.getComputedStyle(overlay)
    expect(overlayStyle.position).toBe('absolute')
    expect(overlayStyle.alignItems).toBe('center')
    expect(overlayStyle.justifyContent).toBe('center')
    expect(['transparent', 'rgba(0, 0, 0, 0)']).toContain(overlayStyle.backgroundColor)
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

    expect(window.getComputedStyle(getContainer(tree)).backgroundColor).toBe(cssColor(expected))
  })

  it('passes an already-resolved color through verbatim', () => {
    const tree = renderThemed(
      'light',
      <QRCodeDisplay color="#FF00FF" containerBackgroundColor="#123456" encodedValue="uniswap" size={100} />,
    )

    expect(window.getComputedStyle(getContainer(tree)).backgroundColor).toBe(cssColor('#123456'))
  })
})
