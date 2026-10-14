import { cleanup, fireEvent, render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { createFocusedRowStore, type FocusedRowStore } from 'uniswap/src/components/lists/focusedRowStore'
import { OnchainItemListOption } from 'uniswap/src/components/lists/items/types'
import type { OnchainItemListProps } from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import { OnchainItemList } from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList.web'
import {
  findFocusableRowIndex,
  getFirstFocusableRowIndex,
  type OnchainItemListData,
} from 'uniswap/src/components/lists/OnchainItemList/rowInfo'
import { ITEM_SECTION_HEADER_ROW_HEIGHT } from 'uniswap/src/components/TokenSelector/constants'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Only the discriminating shape matters here: headers lack `renderItem`, horizontal rows carry an array `item`.
function header(): OnchainItemListData<OnchainItemListOption> {
  return {
    key: 'header',
    measurementKey: 'section-header',
    section: { sectionKey: 'header' },
  } as unknown as OnchainItemListData<OnchainItemListOption>
}

function row(item: unknown): OnchainItemListData<OnchainItemListOption> {
  return {
    key: 'row',
    measurementKey: 'item-row',
    item,
    renderItem: () => null,
  } as unknown as OnchainItemListData<OnchainItemListOption>
}

describe('getFirstFocusableRowIndex', () => {
  it('returns undefined for an empty list', () => {
    expect(getFirstFocusableRowIndex([])).toBeUndefined()
  })

  it('skips a leading section header', () => {
    expect(getFirstFocusableRowIndex([header(), row({ type: 'token' })])).toBe(1)
  })

  it('returns 0 when the first row is a plain item', () => {
    expect(getFirstFocusableRowIndex([row({ type: 'token' }), header(), row({ type: 'pool' })])).toBe(0)
  })

  it('skips horizontal rows (recent-search pills) and their header', () => {
    expect(getFirstFocusableRowIndex([header(), row([{ type: 'token' }]), header(), row({ type: 'token' })])).toBe(3)
  })

  it('returns undefined when only headers and horizontal rows are present', () => {
    expect(getFirstFocusableRowIndex([header(), row([{ type: 'token' }])])).toBeUndefined()
  })
})

describe('findFocusableRowIndex', () => {
  const items = [header(), row([{ type: 'token' }]), header(), row({ type: 'token' }), header(), row({ type: 'pool' })]

  it('steps down over a header to the next item row', () => {
    expect(findFocusableRowIndex({ items, from: 4, direction: 1 })).toBe(5)
  })

  it('steps up over a header and a horizontal pill row', () => {
    expect(findFocusableRowIndex({ items, from: 2, direction: -1 })).toBeUndefined()
    expect(findFocusableRowIndex({ items, from: 4, direction: -1 })).toBe(3)
  })

  it('returns undefined past either end', () => {
    expect(findFocusableRowIndex({ items, from: 6, direction: 1 })).toBeUndefined()
    expect(findFocusableRowIndex({ items, from: -1, direction: -1 })).toBeUndefined()
  })
})

const { listStub } = vi.hoisted(() => ({
  listStub: { scrollIndexIntoView: vi.fn(), scrollToIndex: vi.fn(), scrollToOffset: vi.fn(), scrollToEnd: vi.fn() },
}))

// Only the two values this file imports; the engine itself is covered by mycelium's own leg tests.
vi.mock('@universe/mycelium', () => ({
  Flex: ({ children }: { children?: ReactNode }): ReactElement => <div>{children}</div>,
  UniversalList: ({ ref }: { ref?: { current: typeof listStub | null } }): null => {
    if (ref) {
      ref.current = listStub
    }
    return null
  },
}))

describe('OnchainItemList keyboard navigation', () => {
  const sections = [
    {
      sectionKey: 'tokens',
      data: [
        { type: 'token', id: 'a' },
        { type: 'token', id: 'b' },
      ],
    },
  ] as unknown as OnchainItemListProps<OnchainItemListOption>['sections']

  function renderList(focusedRowIndex: number | undefined): FocusedRowStore {
    const focusedRowStore = createFocusedRowStore(focusedRowIndex)
    vi.spyOn(focusedRowStore, 'setFocusedRowIndex')
    render(
      <OnchainItemList<OnchainItemListOption>
        renderedInModal
        sections={sections}
        renderItem={(): null => null}
        renderSectionHeader={(): ReactElement => <div />}
        keyExtractor={(_item, index): string => `row-${index}`}
        focusedRowStore={focusedRowStore}
      />,
    )
    return focusedRowStore
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(cleanup)

  // `scrollIndexIntoView` moves only a hidden row; `scrollToIndex` would jump on every press. The offset is the
  // row's own section header, which pins over the viewport top once the row is scrolled there.
  it('moves a moving selection with scrollIndexIntoView under its section header, never scrollToIndex', () => {
    const focusedRowStore = renderList(1)

    fireEvent.keyUp(document.body, { key: 'ArrowDown' })

    expect(focusedRowStore.setFocusedRowIndex).toHaveBeenCalledWith(2)
    expect(listStub.scrollIndexIntoView).toHaveBeenCalledWith({ index: 2, viewOffset: ITEM_SECTION_HEADER_ROW_HEIGHT })
    expect(listStub.scrollToIndex).not.toHaveBeenCalled()
  })

  it('skips the section header when seeding focus from nothing', () => {
    const focusedRowStore = renderList(undefined)

    fireEvent.keyUp(document.body, { key: 'ArrowDown' })

    expect(focusedRowStore.setFocusedRowIndex).toHaveBeenCalledWith(1)
    expect(listStub.scrollIndexIntoView).toHaveBeenCalledWith({ index: 1, viewOffset: ITEM_SECTION_HEADER_ROW_HEIGHT })
  })
})
