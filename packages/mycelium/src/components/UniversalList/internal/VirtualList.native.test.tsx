import { cleanup, render } from '@testing-library/react'
import { createRef, type ReactElement, type ReactNode, type Ref } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UniversalListRef, UniversalListRenderItemInfo } from '../types'
import { VirtualList } from './VirtualList.native'

const { captured, legendListStub } = vi.hoisted(() => ({
  captured: { props: {} as Record<string, unknown> },
  legendListStub: { scrollToEnd: vi.fn(), scrollToIndex: vi.fn(), scrollToOffset: vi.fn() },
}))

// Legend List's native build needs a real host renderer. Stand in for it and assert the contract
// this split owns: which props reach the engine, the imperative handle, and the scroll-container
// wrapper. Keeps the suite in jsdom — no react-native runtime involved.
vi.mock('@legendapp/list/react-native', () => ({
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

// The native split imports RefreshControl (a value) from react-native to build the pull-to-refresh
// control. Stub it so the element can be created under jsdom without the react-native runtime.
vi.mock('react-native', () => ({
  Animated: {
    ScrollView: ({ children, ref }: { children?: ReactNode; ref?: Ref<HTMLDivElement> }): ReactElement => (
      <div data-testid="animated-scroll-view" ref={ref}>
        {children}
      </div>
    ),
  },
  RefreshControl: (_props: Record<string, unknown>): null => {
    return null
  },
}))

const keyExtractor = (item: string): string => item
const renderItem = ({ item }: UniversalListRenderItemInfo<string>): ReactElement => <span>{item}</span>
const ItemSeparator = (): ReactElement => <span>sep</span>

function ScrollContainer({ children, ref }: { children?: ReactNode; ref?: Ref<HTMLDivElement> }): ReactElement {
  return <div ref={ref}>{children}</div>
}

beforeEach(() => {
  captured.props = {}
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('VirtualList (native)', () => {
  it('forwards the full prop surface, native-only props included', () => {
    const onContentSizeChange = vi.fn()
    const onEndReached = vi.fn()
    const onRefresh = vi.fn()
    const onScroll = vi.fn()
    const itemsAreEqual = vi.fn(() => true)
    const getFixedItemSize = (item: string): number | undefined => (item === 'Alpha' ? 48 : undefined)
    const getItemSpan = (item: string): number | undefined => (item === 'Alpha' ? 2 : undefined)
    const scrollViewRef = createRef<never>()

    render(
      <VirtualList
        contentContainerStyle={{ className: 'gap-2', style: { paddingBottom: 40 } }}
        data={['Alpha', 'Bravo']}
        drawDistance={800}
        estimatedItemSize={72}
        estimatedListSize={{ width: 390, height: 844 }}
        extraData="expanded"
        getFixedItemSize={getFixedItemSize}
        getItemSpan={getItemSpan}
        horizontal
        itemsAreEqual={itemsAreEqual}
        ItemSeparatorComponent={ItemSeparator}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={keyExtractor}
        ListEmptyComponent={<span>empty</span>}
        ListFooterComponent={<span>footer</span>}
        ListFooterComponentStyle={{ style: { zIndex: -1 } }}
        ListHeaderComponent={<span>header</span>}
        ListHeaderComponentStyle={{ style: { zIndex: 1 } }}
        maintainVisibleContentPosition
        numColumns={2}
        onContentSizeChange={onContentSizeChange}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.25}
        onRefresh={onRefresh}
        onScroll={onScroll}
        recycleItems
        refreshIndicatorColor="#abcdef"
        refreshing
        refScrollView={scrollViewRef}
        renderItem={renderItem}
        scrollEnabled={false}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={{ className: 'h-full', style: { flex: 1 } }}
        testID="universal-list"
        trackRowViewability
      />,
    )

    expect(captured.props).toMatchObject({
      className: 'h-full',
      contentContainerClassName: 'gap-2',
      contentContainerStyle: { paddingBottom: 40 },
      data: ['Alpha', 'Bravo'],
      drawDistance: 800,
      estimatedItemSize: 72,
      estimatedListSize: { width: 390, height: 844 },
      extraData: 'expanded',
      getFixedItemSize,
      horizontal: true,
      itemsAreEqual,
      ItemSeparatorComponent: ItemSeparator,
      keyboardDismissMode: 'on-drag',
      keyboardShouldPersistTaps: 'handled',
      keyExtractor,
      ListFooterComponentStyle: { zIndex: -1 },
      ListHeaderComponentStyle: { zIndex: 1 },
      maintainVisibleContentPosition: true,
      numColumns: 2,
      onContentSizeChange,
      onEndReached,
      onEndReachedThreshold: 0.25,
      onScroll,
      recycleItems: true,
      refreshing: true,
      refScrollView: scrollViewRef,
      renderItem,
      scrollEnabled: false,
      scrollEventThrottle: 16,
      showsHorizontalScrollIndicator: false,
      showsVerticalScrollIndicator: false,
      style: { flex: 1 },
      testID: 'universal-list',
      viewabilityConfig: { id: 'row', itemVisiblePercentThreshold: 0 },
    })
  })

  it("adapts getItemSpan onto Legend List's layout mutator, leaving untouched items alone", () => {
    render(
      <VirtualList
        data={['Alpha', 'Bravo']}
        getItemSpan={(item: string) => (item === 'Alpha' ? 2 : undefined)}
        keyExtractor={keyExtractor}
        numColumns={2}
        renderItem={renderItem}
      />,
    )

    const overrideItemLayout = captured.props['overrideItemLayout'] as (
      layout: { span?: number },
      item: string,
      index: number,
    ) => void

    const spanning: { span?: number } = {}
    overrideItemLayout(spanning, 'Alpha', 0)
    expect(spanning).toEqual({ span: 2 })

    const untouched: { span?: number } = {}
    overrideItemLayout(untouched, 'Bravo', 1)
    expect(untouched).toEqual({})
  })

  it('drops useWindowScroll, which is a DOM-only concept', () => {
    render(<VirtualList useWindowScroll data={['Alpha']} keyExtractor={keyExtractor} renderItem={renderItem} />)

    expect(captured.props).not.toHaveProperty('useWindowScroll')
  })

  it('builds a themed RefreshControl from onRefresh + refreshIndicatorColor rather than forwarding onRefresh', () => {
    const onRefresh = vi.fn()

    render(
      <VirtualList
        data={['Alpha']}
        keyExtractor={keyExtractor}
        onRefresh={onRefresh}
        refreshIndicatorColor="#abcdef"
        refreshing
        renderItem={renderItem}
      />,
    )

    // onRefresh isn't a raw engine prop — it lives on the built control.
    expect(captured.props['onRefresh']).toBeUndefined()
    const control = captured.props['refreshControl'] as ReactElement<{
      onRefresh: () => void
      refreshing: boolean
      tintColor?: string
    }>
    expect(control.props).toMatchObject({ onRefresh, refreshing: true, tintColor: '#abcdef' })
  })

  it('omits the RefreshControl when no onRefresh is provided', () => {
    render(<VirtualList data={['Alpha']} keyExtractor={keyExtractor} renderItem={renderItem} />)

    expect(captured.props['refreshControl']).toBeUndefined()
  })

  it('adapts getItemType to the string type the engine expects', () => {
    render(<VirtualList data={['Alpha']} getItemType={() => 7} keyExtractor={keyExtractor} renderItem={renderItem} />)

    const getItemType = captured.props['getItemType'] as (item: string, index: number) => string

    expect(getItemType('Alpha', 0)).toBe('7')
  })

  it('leaves getItemType undefined when the caller omits it', () => {
    render(<VirtualList data={['Alpha']} keyExtractor={keyExtractor} renderItem={renderItem} />)

    expect(captured.props['getItemType']).toBeUndefined()
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

  describe('scroll container', () => {
    function renderScrollContainer(
      injected?: typeof ScrollContainer,
    ): (props: Record<string, unknown>) => ReactElement {
      render(
        <VirtualList
          data={['Alpha']}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderScrollComponent={injected}
        />,
      )

      return captured.props['renderScrollComponent'] as (props: Record<string, unknown>) => ReactElement
    }

    it('hosts the injected container and passes the scroll props through to it', () => {
      const { container } = render(renderScrollContainer(ScrollContainer)({ children: 'rows', scrollEnabled: false }))

      expect(container.querySelector('div')?.textContent).toBe('rows')
    })

    it('falls back to the Animated.ScrollView Legend List would have rendered', () => {
      const { getByTestId } = render(renderScrollContainer()({ children: 'rows' }))

      expect(getByTestId('animated-scroll-view').textContent).toBe('rows')
    })

    it("hands the engine's scroll-view ref to the container", () => {
      const scrollRef = createRef<HTMLDivElement>()

      render(renderScrollContainer(ScrollContainer)({ children: 'rows', ref: scrollRef }))

      expect(scrollRef.current).toBeInstanceOf(HTMLDivElement)
    })

    it('feeds the engine only the newest scroll event of a frame', () => {
      vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] })
      const onScroll = vi.fn()
      let hostOnScroll: ((event: unknown) => void) | undefined
      const Host = ({ onScroll: handler }: { onScroll?: (event: unknown) => void }): null => {
        hostOnScroll = handler
        return null
      }

      render(renderScrollContainer(Host as never)({ onScroll }))
      hostOnScroll?.({ nativeEvent: { contentOffset: { y: 10 } } })
      hostOnScroll?.({ nativeEvent: { contentOffset: { y: 20 } } })
      expect(onScroll).not.toHaveBeenCalled()

      vi.runOnlyPendingTimers()
      expect(onScroll).toHaveBeenCalledTimes(1)
      expect(onScroll).toHaveBeenCalledWith({ nativeEvent: { contentOffset: { y: 20 } } })
      vi.useRealTimers()
    })

    it('keeps a pooled scroll event alive until the deferred flush reads it', () => {
      vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] })
      const onScroll = vi.fn()
      let hostOnScroll: ((event: unknown) => void) | undefined
      const Host = ({ onScroll: handler }: { onScroll?: (event: unknown) => void }): null => {
        hostOnScroll = handler
        return null
      }
      render(renderScrollContainer(Host as never)({ onScroll }))

      // React Native's renderer nulls a synthetic event once the handler returns unless it was persisted.
      const persisted = { nativeEvent: { contentOffset: { y: 10 } }, persist: vi.fn() }
      hostOnScroll?.(persisted)
      expect(persisted.persist).toHaveBeenCalledTimes(1)

      const pooled: { nativeEvent: { contentOffset: { y: number } } | null } = {
        nativeEvent: { contentOffset: { y: 20 } },
      }
      hostOnScroll?.(pooled)
      pooled.nativeEvent = null

      vi.runOnlyPendingTimers()
      expect(onScroll).toHaveBeenCalledTimes(1)
      expect(onScroll).toHaveBeenCalledWith(expect.objectContaining({ nativeEvent: { contentOffset: { y: 20 } } }))
      vi.useRealTimers()
    })

    it('leaves a non-function scroll handler (Animated.event) untouched', () => {
      const animatedEvent = { __isNative: true }
      let hostOnScroll: unknown
      const Host = ({ onScroll: handler }: { onScroll?: unknown }): null => {
        hostOnScroll = handler
        return null
      }

      render(renderScrollContainer(Host as never)({ onScroll: animatedEvent }))

      expect(hostOnScroll).toBe(animatedEvent)
    })
  })
})
