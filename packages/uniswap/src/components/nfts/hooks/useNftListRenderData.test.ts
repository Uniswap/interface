import { waitFor } from '@testing-library/react-native'
import { GetWalletNftsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { SharedQueryClient } from '@universe/api'
import { useNftListRenderData } from 'uniswap/src/components/nfts/hooks/useNftListRenderData'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { renderHookWithProviders } from 'uniswap/src/test/render'

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
})
