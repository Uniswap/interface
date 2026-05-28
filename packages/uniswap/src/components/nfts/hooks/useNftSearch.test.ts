import { useNftSearch } from 'uniswap/src/components/nfts/hooks/useNftSearch'
import { HIDDEN_NFTS_ROW } from 'uniswap/src/features/nfts/constants'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { act, renderHook } from 'uniswap/src/test/test-utils'

const createMockNft = (overrides: Partial<NFTItem> = {}): NFTItem => ({
  name: 'Bored Ape #1234',
  collectionName: 'Bored Ape Yacht Club',
  tokenId: '1234',
  contractAddress: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
  ...overrides,
})

const boredApe = createMockNft()

const PUNK = createMockNft({
  name: 'CryptoPunk #1234',
  collectionName: 'CryptoPunks',
  tokenId: '1234',
  contractAddress: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
  isSpam: true,
})

const defaultParams = {
  shownNfts: [boredApe],
  hiddenNfts: [PUNK],
  hiddenNftsExpanded: false,
  hasNextPage: false,
}

describe('useNftSearch', () => {
  it('returns unfiltered shown and hidden arrays when search is empty', () => {
    const { result } = renderHook(() => useNftSearch(defaultParams))

    expect(result.current.search).toBe('')
    expect(result.current.filteredShownNfts).toBe(defaultParams.shownNfts)
    expect(result.current.filteredHiddenNfts).toBe(defaultParams.hiddenNfts)
    expect(result.current.filteredShownCount).toBe(1)
    expect(result.current.filteredHiddenCount).toBe(1)
  })

  it('builds nfts array from shown and hidden NFTs', () => {
    const { result } = renderHook(() => useNftSearch(defaultParams))

    // boredApe is shown; PUNK is hidden but not expanded, and allPagesFetched=true so HIDDEN_NFTS_ROW appears
    expect(result.current.nfts).toContain(boredApe)
    expect(result.current.nfts).toContain(HIDDEN_NFTS_ROW)
    expect(result.current.nfts).not.toContain(PUNK)
  })

  it('filters shownNfts by search term — matching items included', () => {
    const { result } = renderHook(() => useNftSearch(defaultParams))

    act(() => {
      result.current.setSearch('bored')
    })

    expect(result.current.filteredShownNfts).toEqual([boredApe])
    expect(result.current.filteredShownCount).toBe(1)
  })

  it('filters shownNfts by search term — non-matching items excluded', () => {
    const params = { ...defaultParams, shownNfts: [boredApe, PUNK] }
    const { result } = renderHook(() => useNftSearch(params))

    act(() => {
      result.current.setSearch('bored')
    })

    expect(result.current.filteredShownNfts).toEqual([boredApe])
    expect(result.current.filteredShownNfts).not.toContain(PUNK)
  })

  it('filters hiddenNfts by search term — matching items included', () => {
    const { result } = renderHook(() => useNftSearch(defaultParams))

    act(() => {
      result.current.setSearch('punk')
    })

    expect(result.current.filteredHiddenNfts).toEqual([PUNK])
    expect(result.current.filteredHiddenCount).toBe(1)
  })

  it('filters hiddenNfts by search term — non-matching items excluded', () => {
    const { result } = renderHook(() => useNftSearch(defaultParams))

    act(() => {
      result.current.setSearch('bored')
    })

    expect(result.current.filteredHiddenNfts).toEqual([])
    expect(result.current.filteredHiddenCount).toBe(0)
  })

  it('rebuilds nfts array via buildNftsArray when searching', () => {
    const { result } = renderHook(() => useNftSearch(defaultParams))

    act(() => {
      result.current.setSearch('bored')
    })

    // Only boredApe matches; PUNK doesn't appear in hiddenNfts after filtering so HIDDEN_NFTS_ROW is also absent
    expect(result.current.nfts).toContain(boredApe)
    expect(result.current.nfts).not.toContain(PUNK)
    expect(result.current.nfts).not.toContain(HIDDEN_NFTS_ROW)
  })

  it('returns empty filtered arrays when no NFTs match', () => {
    const { result } = renderHook(() => useNftSearch(defaultParams))

    act(() => {
      result.current.setSearch('azuki')
    })

    expect(result.current.filteredShownNfts).toEqual([])
    expect(result.current.filteredHiddenNfts).toEqual([])
    expect(result.current.filteredShownCount).toBe(0)
    expect(result.current.filteredHiddenCount).toBe(0)
  })

  it('restores unfiltered arrays when search is cleared', () => {
    const { result } = renderHook(() => useNftSearch(defaultParams))

    act(() => {
      result.current.setSearch('bored')
    })
    expect(result.current.filteredShownCount).toBe(1)
    expect(result.current.filteredHiddenCount).toBe(0)

    act(() => {
      result.current.setSearch('')
    })

    expect(result.current.filteredShownNfts).toBe(defaultParams.shownNfts)
    expect(result.current.filteredHiddenNfts).toBe(defaultParams.hiddenNfts)
    expect(result.current.filteredShownCount).toBe(1)
    expect(result.current.filteredHiddenCount).toBe(1)
  })
})
