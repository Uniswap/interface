import { waitFor } from '@testing-library/react-native'
import { GetWalletNftsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { SharedQueryClient } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { useNftListRenderData } from 'uniswap/src/components/nfts/hooks/useNftListRenderData'
import { HIDDEN_NFTS_ROW } from 'uniswap/src/features/nfts/constants'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import { sleep } from 'utilities/src/time/timing'

const { mockUseEnabledChains, mockGetWalletNfts } = vi.hoisted(() => ({
  mockUseEnabledChains: vi.fn(),
  mockGetWalletNfts: vi.fn(),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2')>()),
  dataApiServiceClientV2: { getWalletNfts: mockGetWalletNfts },
}))

const OWNER = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D'

function nftPage({ tokenIds, isSpam, nextPageToken }: { tokenIds: string[]; isSpam: boolean; nextPageToken?: string }) {
  return new GetWalletNftsResponse({
    nfts: tokenIds.map((tokenId) => ({
      chainId: UniverseChainId.Mainnet,
      name: `NFT #${tokenId}`,
      contractAddress: OWNER,
      tokenId,
      isSpam,
    })),
    page: { nextPageToken },
  })
}

describe('useNftListRenderData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    SharedQueryClient.clear()
    mockUseEnabledChains.mockReturnValue({ chains: [UniverseChainId.Mainnet] })
  })

  it('reports not pending and does not fetch when skipped (e.g. Solana-only wallet)', async () => {
    const { result } = renderHookWithProviders(() => useNftListRenderData({ owner: '', skip: true }))

    expect(result.current.isPending).toBe(false)
    expect(result.current.isErrorState).toBe(false)
    expect(result.current.nfts).toEqual([])

    await waitFor(() => {
      expect(mockGetWalletNfts).not.toHaveBeenCalled()
    })
  })

  it('reports pending while the query is fetching', () => {
    mockGetWalletNfts.mockReturnValue(new Promise(() => {}))

    const { result } = renderHookWithProviders(() => useNftListRenderData({ owner: OWNER }))

    expect(result.current.isPending).toBe(true)
    expect(result.current.isErrorState).toBe(false)
  })

  it('returns mapped nfts once the query resolves', async () => {
    mockGetWalletNfts.mockResolvedValue(
      new GetWalletNftsResponse({
        nfts: [
          {
            chainId: UniverseChainId.Mainnet,
            name: 'Bored Ape #1234',
            contractAddress: OWNER,
            tokenId: '1234',
            collectionName: 'Bored Ape Yacht Club',
          },
        ],
      }),
    )

    const { result } = renderHookWithProviders(() => useNftListRenderData({ owner: OWNER }))

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
    expect(result.current.shownNfts).toHaveLength(1)
    expect(result.current.shownNfts[0]?.name).toBe('Bored Ape #1234')
    expect(result.current.isErrorState).toBe(false)
  })

  it('reports error state when the query fails', async () => {
    mockGetWalletNfts.mockRejectedValue(new Error('network down'))

    const { result } = renderHookWithProviders(() => useNftListRenderData({ owner: OWNER }))

    await waitFor(() => {
      expect(result.current.isErrorState).toBe(true)
    })
    expect(result.current.isPending).toBe(false)
  })

  describe('when a page contains only spam', () => {
    it('keeps fetching pages until a shown NFT arrives', async () => {
      mockGetWalletNfts
        .mockResolvedValueOnce(nftPage({ tokenIds: ['1', '2'], isSpam: true, nextPageToken: 'page-2' }))
        .mockResolvedValueOnce(nftPage({ tokenIds: ['3'], isSpam: true, nextPageToken: 'page-3' }))
        .mockResolvedValueOnce(nftPage({ tokenIds: ['4'], isSpam: false, nextPageToken: 'page-4' }))

      const { result } = renderHookWithProviders(() => useNftListRenderData({ owner: OWNER }))

      await waitFor(() => {
        expect(result.current.shownNfts).toHaveLength(1)
      })
      expect(result.current.shownNfts[0]?.tokenId).toBe('4')
      expect(result.current.numHidden).toBe(3)
      expect(result.current.isPending).toBe(false)
      expect(result.current.hasNextPage).toBe(true)
      // Stops once something is shown; further pages are left to scrolling
      expect(mockGetWalletNfts).toHaveBeenCalledTimes(3)
    })

    it('stays pending instead of reporting empty while the next page loads', async () => {
      mockGetWalletNfts
        .mockResolvedValueOnce(nftPage({ tokenIds: ['1'], isSpam: true, nextPageToken: 'page-2' }))
        .mockReturnValueOnce(new Promise(() => {}))

      const { result } = renderHookWithProviders(() => useNftListRenderData({ owner: OWNER }))

      await waitFor(() => {
        expect(mockGetWalletNfts).toHaveBeenCalledTimes(2)
      })
      expect(result.current.numHidden).toBe(1)
      expect(result.current.isPending).toBe(true)
      expect(result.current.isErrorState).toBe(false)
    })

    it('stops at the last page and surfaces the hidden NFTs', async () => {
      mockGetWalletNfts
        .mockResolvedValueOnce(nftPage({ tokenIds: ['1'], isSpam: true, nextPageToken: 'page-2' }))
        .mockResolvedValueOnce(nftPage({ tokenIds: ['2'], isSpam: true }))

      const { result } = renderHookWithProviders(() => useNftListRenderData({ owner: OWNER }))

      await waitFor(() => {
        expect(result.current.numHidden).toBe(2)
      })
      expect(result.current.hasNextPage).toBe(false)
      expect(result.current.isPending).toBe(false)
      expect(result.current.nfts).toEqual([HIDDEN_NFTS_ROW])
      expect(mockGetWalletNfts).toHaveBeenCalledTimes(2)
    })

    it('reports error state and stops paging when the next page fails', async () => {
      mockGetWalletNfts
        .mockResolvedValueOnce(nftPage({ tokenIds: ['1'], isSpam: true, nextPageToken: 'page-2' }))
        .mockRejectedValue(new Error('network down'))

      const { result } = renderHookWithProviders(() => useNftListRenderData({ owner: OWNER }))

      await waitFor(() => {
        expect(result.current.isErrorState).toBe(true)
      })
      expect(result.current.isPending).toBe(false)
      await sleep(50)
      expect(mockGetWalletNfts).toHaveBeenCalledTimes(2)
    })
  })
})
