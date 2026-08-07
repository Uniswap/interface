import { cleanup, render } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UniversalListRef, UniversalListRenderItemInfo } from '../types'
import { VirtualList } from './VirtualList'

const { captured, legendListStub } = vi.hoisted(() => ({
  captured: { props: {} as Record<string, unknown> },
  legendListStub: { scrollToEnd: vi.fn(), scrollToIndex: vi.fn(), scrollToOffset: vi.fn() },
}))

// Legend List wants real layout + ResizeObserver, neither of which jsdom has. Stand in for it and
// assert the contract this split owns: which props reach the engine, and the imperative handle.
vi.mock('@legendapp/list/react', () => ({
  LegendList: ({
    ref,
    ...props
  }: Record<string, unknown> & { ref?: { current: typeof legendListStub | null } }): null => {
    captured.props = props
    if (ref) {
      ref.current = legendListStub
    }
    return null
  },
}))

const keyExtractor = (item: string): string => item
const renderItem = ({ item }: UniversalListRenderItemInfo<string>): JSX.Element => <span>{item}</span>
const ScrollContainer = ({ children }: { children?: React.ReactNode }): JSX.Element => <div>{children}</div>

beforeEach(() => {
  captured.props = {}
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('VirtualList (web)', () => {
  it('forwards the props the DOM build supports, including testID as data-testid', () => {
    render(
      <VirtualList
        contentContainerStyle={{ className: 'gap-2' }}
        data={['Alpha', 'Bravo']}
        estimatedItemSize={44}
        horizontal
        keyExtractor={keyExtractor}
        numColumns={2}
        onEndReachedThreshold={0.25}
        recycleItems
        renderItem={renderItem}
        style={{ className: 'h-full' }}
        testID="universal-list"
      />,
    )

    expect(captured.props).toMatchObject({
      className: 'h-full',
      contentContainerClassName: 'gap-2',
      'data-testid': 'universal-list',
      data: ['Alpha', 'Bravo'],
      estimatedItemSize: 44,
      horizontal: true,
      numColumns: 2,
      onEndReachedThreshold: 0.25,
      recycleItems: true,
    })
  })

  it('drops the native-only props instead of leaking them onto the DOM', () => {
    render(
      <VirtualList
        data={['Alpha']}
        keyboardShouldPersistTaps="handled"
        keyExtractor={keyExtractor}
        onRefresh={vi.fn()}
        refreshing
        renderItem={renderItem}
        renderScrollComponent={ScrollContainer}
        testID="universal-list"
      />,
    )

    for (const prop of ['keyboardShouldPersistTaps', 'onRefresh', 'refreshing', 'renderScrollComponent', 'testID']) {
      expect(captured.props).not.toHaveProperty(prop)
    }
  })

  it('adapts getItemType to the string type the engine expects', () => {
    render(<VirtualList data={['Alpha']} getItemType={() => 7} keyExtractor={keyExtractor} renderItem={renderItem} />)

    const getItemType = captured.props.getItemType as (item: string, index: number) => string

    expect(getItemType('Alpha', 0)).toBe('7')
  })

  it('delegates the imperative handle to the engine ref', () => {
    const ref = createRef<UniversalListRef>()

    render(<VirtualList ref={ref} data={['Alpha']} keyExtractor={keyExtractor} renderItem={renderItem} />)

    ref.current?.scrollToIndex({ index: 3, animated: true })
    ref.current?.scrollToOffset({ offset: 120 })
    ref.current?.scrollToEnd({ animated: false })
    ref.current?.scrollToTop({ animated: false })

    expect(legendListStub.scrollToIndex).toHaveBeenCalledWith({ index: 3, animated: true })
    expect(legendListStub.scrollToEnd).toHaveBeenCalledWith({ animated: false })
    expect(legendListStub.scrollToOffset).toHaveBeenNthCalledWith(1, { offset: 120 })
    // scrollToTop is our own addition — it maps onto scrollToOffset at offset 0.
    expect(legendListStub.scrollToOffset).toHaveBeenNthCalledWith(2, { offset: 0, animated: false })
  })
})
