import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { AnimatedTab } from 'src/app/features/home/AnimatedTab'
import { render } from 'src/test/test-utils'

type TabProps = { isActive: boolean; hideLeft?: boolean; hideRight?: boolean }

// The compat Flex emits Tailwind classes plus a --c-tr transform var; assert on those lanes.
const renderTab = (props: TabProps): HTMLElement => {
  const { container } = render(
    <AnimatedTab {...props}>
      <span>tab content</span>
    </AnimatedTab>,
  )
  const tab = container.querySelector('div')
  if (!tab) {
    throw new Error('AnimatedTab rendered no element')
  }
  return tab
}

describe('AnimatedTab', () => {
  // HomeScreen renders exactly these states: a tab is active xor hidden toward one side.
  const truthTable = [
    {
      name: 'active',
      props: { isActive: true },
      display: 'flex',
      opacity: 'opacity-[1]',
      translateX: 'translateX(0px)',
      pointerEvents: '[pointer-events:auto]',
    },
    {
      name: 'hidden toward the left',
      props: { isActive: false, hideLeft: true },
      display: 'hidden',
      opacity: 'opacity-[0]',
      translateX: 'translateX(-10px)',
      pointerEvents: '[pointer-events:none]',
    },
    {
      name: 'hidden toward the right',
      props: { isActive: false, hideRight: true },
      display: 'hidden',
      opacity: 'opacity-[0]',
      translateX: 'translateX(10px)',
      pointerEvents: '[pointer-events:none]',
    },
  ] as const

  it.each(truthTable)(
    '$name tab renders the expected styles',
    ({ props, display, opacity, translateX, pointerEvents }) => {
      const tab = renderTab(props)
      const opposingDisplay = display === 'flex' ? 'hidden' : 'flex'

      expect(tab.classList.contains(display)).toBe(true)
      expect(tab.classList.contains(opposingDisplay)).toBe(false)
      expect(tab.classList.contains(opacity)).toBe(true)
      expect(tab.classList.contains(pointerEvents)).toBe(true)
      expect(tab.style.getPropertyValue('--c-tr')).toBe(translateX)
    },
  )

  it('inactive tab is non-interactive even without a hide direction', () => {
    const tab = renderTab({ isActive: false })

    expect(tab.classList.contains('hidden')).toBe(true)
    expect(tab.classList.contains('flex')).toBe(false)
    expect(tab.classList.contains('[pointer-events:none]')).toBe(true)
  })

  it('does not mount children until the tab is first activated', () => {
    const { queryByText, rerender } = render(
      <AnimatedTab isActive={false} hideRight>
        <span>tab content</span>
      </AnimatedTab>,
    )

    // A list that first measures itself inside display:none never recovers its row positions.
    expect(queryByText('tab content')).toBeNull()

    rerender(
      <AnimatedTab isActive hideRight={false}>
        <span>tab content</span>
      </AnimatedTab>,
    )
    expect(queryByText('tab content')).not.toBeNull()
  })

  it('keeps children mounted after the tab is deactivated again', () => {
    const { queryByText, rerender } = render(
      <AnimatedTab isActive>
        <span>tab content</span>
      </AnimatedTab>,
    )
    expect(queryByText('tab content')).not.toBeNull()

    rerender(
      <AnimatedTab isActive={false} hideRight>
        <span>tab content</span>
      </AnimatedTab>,
    )

    // Switching back should be instant, so the subtree stays mounted behind display:none.
    expect(queryByText('tab content')).not.toBeNull()
  })

  it('scopes the transition to opacity and transform (color-flash rule)', () => {
    const tab = renderTab({ isActive: true })
    const quicker = SPORE_ANIMATION_CURVE_CSS.quicker

    expect(tab.style.transition).toBe(`opacity ${quicker}, transform ${quicker}`)
  })
})
