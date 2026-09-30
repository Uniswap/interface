import { cleanup, render } from '@testing-library/react'
import { createRef, type ReactElement } from 'react'
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
const renderItem = ({ item }: UniversalListRenderItemInfo<string>): ReactElement => <span>{item}</span>
const ItemSeparator = (): ReactElement => <span>sep</span>
const ScrollContainer = ({ children }: { children?: React.ReactNode }): ReactElement => <div>{children}</div>

beforeEach(() => {
  captured.props = {}
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('VirtualList (web)', () => {
  it('forwards the props the DOM build supports, including testID as data-testid', () => {
    const itemsAreEqual = vi.fn(() => true)
    const getItemSpan = (item: string): number | undefined => (item === 'Alpha' ? 2 : undefined)
    const onScroll = vi.fn()

    render(
      <VirtualList
        contentContainerStyle={{ className: 'gap-2' }}
        data={['Alpha', 'Bravo']}
        drawDistance={800}
        estimatedItemSize={44}
        estimatedListSize={{ width: 390, height: 844 }}
        extraData="expanded"
        getItemSpan={getItemSpan}
        horizontal
        itemsAreEqual={itemsAreEqual}
        ItemSeparatorComponent={ItemSeparator}
        keyExtractor={keyExtractor}
        numColumns={2}
        onEndReachedThreshold={0.25}
        onScroll={onScroll}
        recycleItems
        scrollEventThrottle={16}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={{ className: 'h-full' }}
        testID="universal-list"
        trackRowViewability
      />,
    )

    expect(captured.props).toMatchObject({
      className: 'h-full',
      contentContainerClassName: 'gap-2',
      'data-testid': 'universal-list',
      data: ['Alpha', 'Bravo'],
      drawDistance: 800,
      estimatedItemSize: 44,
      estimatedListSize: { width: 390, height: 844 },
      extraData: 'expanded',
      horizontal: true,
      itemsAreEqual,
      ItemSeparatorComponent: ItemSeparator,
      numColumns: 2,
      onEndReachedThreshold: 0.25,
      onScroll,
      recycleItems: true,
      scrollEventThrottle: 16,
      showsHorizontalScrollIndicator: false,
      showsVerticalScrollIndicator: false,
      viewabilityConfig: { id: 'row', itemVisiblePercentThreshold: 0 },
    })
  })

  it('forwards useWindowScroll so the page can be the scroller instead of an inner container', () => {
    render(<VirtualList useWindowScroll data={['Alpha']} keyExtractor={keyExtractor} renderItem={renderItem} />)

    expect(captured.props['useWindowScroll']).toBe(true)
  })

  it('translates scrollEnabled=false into an overflow-hidden style, not a scrollEnabled prop', () => {
    render(<VirtualList data={['Alpha']} keyExtractor={keyExtractor} renderItem={renderItem} scrollEnabled={false} />)

    expect(captured.props).not.toHaveProperty('scrollEnabled')
    expect(captured.props['style']).toMatchObject({ overflowX: 'hidden', overflowY: 'hidden' })
  })

  it('leaves scrolling enabled (no overflow override) when scrollEnabled is not false', () => {
    render(<VirtualList data={['Alpha']} keyExtractor={keyExtractor} renderItem={renderItem} scrollEnabled />)

    expect(captured.props['style']).toBeUndefined()
  })

  it('applies the raw .style escape hatches as inline styles on the DOM', () => {
    render(
      <VirtualList
        contentContainerStyle={{ style: { paddingBottom: 40 } }}
        data={['Alpha']}
        keyExtractor={keyExtractor}
        ListFooterComponentStyle={{ style: { zIndex: -1 } }}
        ListHeaderComponentStyle={{ style: { zIndex: 1 } }}
        renderItem={renderItem}
        style={{ style: { flex: 1 } }}
      />,
    )

    expect(captured.props['style']).toMatchObject({ flex: 1 })
    expect(captured.props['contentContainerStyle']).toMatchObject({ paddingBottom: 40 })
    expect(captured.props['ListHeaderComponentStyle']).toMatchObject({ zIndex: 1 })
    expect(captured.props['ListFooterComponentStyle']).toMatchObject({ zIndex: -1 })
  })

  it('merges the container .style with the scroll-disabled overflow override', () => {
    render(
      <VirtualList
        data={['Alpha']}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        scrollEnabled={false}
        style={{ style: { flex: 1 } }}
      />,
    )

    expect(captured.props['style']).toMatchObject({ flex: 1, overflowX: 'hidden', overflowY: 'hidden' })
  })

  it('drops the native-only props instead of leaking them onto the DOM', () => {
    const scrollViewRef = createRef<never>()

    render(
      <VirtualList
        data={['Alpha']}
        keyboardShouldPersistTaps="handled"
        keyExtractor={keyExtractor}
        onContentSizeChange={vi.fn()}
        onRefresh={vi.fn()}
        refreshIndicatorColor="#abcdef"
        refreshing
        refScrollView={scrollViewRef}
        renderItem={renderItem}
        renderScrollComponent={ScrollContainer}
      />,
    )

    for (const prop of [
      'keyboardShouldPersistTaps',
      'onContentSizeChange',
      'onRefresh',
      'refreshControl',
      'refreshIndicatorColor',
      'refreshing',
      'refScrollView',
      'renderScrollComponent',
    ]) {
      expect(captured.props).not.toHaveProperty(prop)
    }
  })

  it('adapts getItemType to the string type the engine expects', () => {
    render(<VirtualList data={['Alpha']} getItemType={() => 7} keyExtractor={keyExtractor} renderItem={renderItem} />)

    const getItemType = captured.props['getItemType'] as (item: string, index: number) => string

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
