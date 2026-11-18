import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { describe, expect, it, vi } from 'vitest'
import type { SegmentedControlProps } from './types'

// No native-runtime test lane: react-native and reanimated are stood in as host elements, the
// AnimatableCopyIconCompat.native.test.tsx pattern.
vi.mock('react-native-reanimated', () => import('../presence/testing/reanimated-mock'))
vi.mock('react-native', () => ({
  Platform: { select: <T,>(options: { default: T }): T => options.default },
  Pressable: 'Pressable',
  Text: 'Text',
  View: 'View',
}))

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const OPTIONS = [{ value: 'long' }, { value: 'short' }] as const

async function renderMeasured(props: Partial<SegmentedControlProps>): Promise<ReactTestRenderer> {
  const { SegmentedControl } = await import('./SegmentedControl.native')
  let renderer: ReactTestRenderer | undefined
  act(() => {
    renderer = create(<SegmentedControl options={OPTIONS} selectedOption="long" onSelectOption={vi.fn()} {...props} />)
  })
  if (!renderer) {
    throw new Error('render produced no tree')
  }
  // The indicator mounts once the selected option reports its layout.
  const options = renderer.root
    .findAllByType('Pressable' as never)
    .filter((node) => node.props['onLayout'] !== undefined)
  act(() => {
    for (const option of options) {
      option.props['onLayout']({ nativeEvent: { layout: { x: 0, y: 0, width: 80, height: 32 } } })
    }
  })
  return renderer
}

function indicatorPill(renderer: ReactTestRenderer): ReactTestInstance {
  return renderer.root.findByProps({ testID: 'segmented-control-indicator' }).findByType('Pressable' as never)
}

describe('SegmentedControl (native) indicator', () => {
  it('fills the indicator with the neutral surface3 by default', async () => {
    const renderer = await renderMeasured({})
    expect(indicatorPill(renderer).props['className']).toContain('bg-surface3')
    act(() => renderer.unmount())
  })

  it('fills the indicator with indicatorColor in place of the neutral fill', async () => {
    const renderer = await renderMeasured({ indicatorColor: '$statusSuccess2' })
    const className: string = indicatorPill(renderer).props['className']
    expect(className).toContain('bg-success-secondary')
    expect(className).not.toMatch(/bg-surface3/)
    act(() => renderer.unmount())
  })
})
