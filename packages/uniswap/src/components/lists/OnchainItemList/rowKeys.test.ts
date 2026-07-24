import {
  getRowsStructuralSignature,
  getSectionHeaderRowKey,
  getSectionItemRowKey,
} from 'uniswap/src/components/lists/OnchainItemList/rowKeys'

describe('rowKeys', () => {
  it('builds a section-scoped header key', () => {
    expect(getSectionHeaderRowKey('recentsearches')).toBe('section-recentsearches')
  })

  it('builds a section-scoped item key from the item key', () => {
    expect(getSectionItemRowKey({ sectionKey: 'stocks', itemKey: 'rwa-collection-NVDA', index: 2 })).toBe(
      'item-stocks-rwa-collection-NVDA',
    )
  })

  it('falls back to the positional index only when the item key is missing', () => {
    expect(getSectionItemRowKey({ sectionKey: 'stocks', itemKey: undefined, index: 2 })).toBe('item-stocks-2')
  })

  it('produces an identical signature regardless of object identity (same keys/order)', () => {
    const a = getRowsStructuralSignature(['section-recent', 'item-recent-A', 'section-stocks', 'item-stocks-B'])
    const b = getRowsStructuralSignature(['section-recent', 'item-recent-A', 'section-stocks', 'item-stocks-B'])
    expect(a).toBe(b)
  })

  it('changes the signature when a row is removed (recents cleared)', () => {
    const withRecents = getRowsStructuralSignature([
      'section-recent',
      'item-recent-A',
      'section-stocks',
      'item-stocks-B',
    ])
    const cleared = getRowsStructuralSignature(['section-stocks', 'item-stocks-B'])
    expect(cleared).not.toBe(withRecents)
  })

  it('changes the signature when rows reorder', () => {
    const order1 = getRowsStructuralSignature(['item-stocks-A', 'item-stocks-B'])
    const order2 = getRowsStructuralSignature(['item-stocks-B', 'item-stocks-A'])
    expect(order1).not.toBe(order2)
  })
})
