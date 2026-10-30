import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AnimatedFlexCompat } from './AnimatedFlexCompat.web'

describe('AnimatedFlexCompat (web)', () => {
  it('strips the Reanimated props before they reach the DOM', () => {
    // Placeholder builders: the contract is about the prop KEYS never reaching
    // the DOM, whatever their value.
    const preset = { build: (): Record<string, never> => ({}) }
    const { container } = render(
      <AnimatedFlexCompat entering={preset} exiting={preset} layout={preset} testID="stripped" />,
    )

    const element = container.querySelector('[data-testid="stripped"]')
    expect(element).not.toBeNull()
    for (const stripped of ['entering', 'exiting', 'layout']) {
      expect(element?.hasAttribute(stripped)).toBe(false)
    }
  })

  it('flattens an array-form style onto the rendered host', () => {
    // `BaseCard` in ui passes `[scaleAnchor, animatedStyle]` to `AnimatedFlex` (this component's
    // barrel alias); both members must land on the host.
    const { container } = render(
      <AnimatedFlexCompat style={[{ transformOrigin: 'center bottom' }, { opacity: 0.5 }]} testID="array-style-web" />,
    )

    const element = container.querySelector<HTMLElement>('[data-testid="array-style-web"]')
    expect(element).not.toBeNull()
    expect(element?.style.transformOrigin).toBe('center bottom')
    expect(element?.style.opacity).toBe('0.5')
  })

  it('forwards the caller ref to the rendered host', () => {
    let refValue: unknown
    render(
      <AnimatedFlexCompat
        ref={(node: unknown): void => {
          refValue = node
        }}
        testID="ref-web"
      />,
    )

    expect(refValue).toBeInstanceOf(HTMLElement)
  })
})
