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

const keyExtractor = (item: string): string => item
const renderItem = ({ item }: UniversalListRenderItemInfo<string>): JSX.Element => <span>{item}</span>

function ScrollContainer({ children, ref }: { children?: ReactNode; ref?: Ref<HTMLDivElement> }): JSX.Element {
  return <div ref={ref}>{children}</div>
}

beforeEach(() => {
  captured.props = {}
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('VirtualList (native)', () => {
  it('forwards the full prop surface, native-only props included', () => {
    const onEndReached = vi.fn()
    const onRefresh = vi.fn()

    render(
      <VirtualList
        contentContainerStyle={{ className: 'gap-2' }}
        data={['Alpha', 'Bravo']}
        estimatedItemSize={72}
        horizontal
        keyboardShouldPersistTaps="handled"
        keyExtractor={keyExtractor}
        ListEmptyComponent={<span>empty</span>}
        ListFooterComponent={<span>footer</span>}
        ListHeaderComponent={<span>header</span>}
        maintainVisibleContentPosition
        numColumns={2}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.25}
        onRefresh={onRefresh}
        recycleItems
        refreshing
        renderItem={renderItem}
        style={{ className: 'h-full' }}
        testID="universal-list"
      />,
    )

    expect(captured.props).toMatchObject({
      className: 'h-full',
      contentContainerClassName: 'gap-2',
      data: ['Alpha', 'Bravo'],
      estimatedItemSize: 72,
      horizontal: true,
      keyboardShouldPersistTaps: 'handled',
      keyExtractor,
      maintainVisibleContentPosition: true,
      numColumns: 2,
      onEndReached,
      onEndReachedThreshold: 0.25,
      onRefresh,
      recycleItems: true,
      refreshing: true,
      renderItem,
      testID: 'universal-list',
    })
  })

  it('adapts getItemType to the string type the engine expects', () => {
    render(<VirtualList data={['Alpha']} getItemType={() => 7} keyExtractor={keyExtractor} renderItem={renderItem} />)

    const getItemType = captured.props.getItemType as (item: string, index: number) => string

    expect(getItemType('Alpha', 0)).toBe('7')
  })

  it('leaves getItemType undefined when the caller omits it', () => {
    render(<VirtualList data={['Alpha']} keyExtractor={keyExtractor} renderItem={renderItem} />)

    expect(captured.props.getItemType).toBeUndefined()
    expect(captured.props.renderScrollComponent).toBeUndefined()
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

  describe('renderScrollComponent', () => {
    function renderWithScrollContainer(): (props: Record<string, unknown>) => ReactElement {
      render(
        <VirtualList
          data={['Alpha']}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderScrollComponent={ScrollContainer}
        />,
      )

      return captured.props.renderScrollComponent as (props: Record<string, unknown>) => ReactElement
    }

    it('passes the scroll props through to the injected container', () => {
      const onScroll = vi.fn()

      const element = renderWithScrollContainer()({ children: 'rows', onScroll })

      expect(element.type).toBe(ScrollContainer)
      expect(element.props).toMatchObject({ children: 'rows', onScroll })
    })

    it("hands the engine's scroll-view ref to the injected container", () => {
      const scrollRef = createRef<HTMLDivElement>()

      render(renderWithScrollContainer()({ children: 'rows', ref: scrollRef }))

      expect(scrollRef.current).toBeInstanceOf(HTMLDivElement)
    })
  })
})
