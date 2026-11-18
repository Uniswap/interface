import { GetTokenHistoryTVLResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { UniverseChainId } from '@universe/chains'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { useTokenMarketStats } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { currentTimeInSeconds } from 'utilities/src/time/time'
import { useTDPTVLChartData } from '~/pages/TokenDetails/components/chart/hooks/useTDPTVLChartData'
import { renderHook, waitFor } from '~/test-utils/render'
import { DataQuality } from '~/utils/charts'

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: { getTokenHistoryTVL: vi.fn() },
}))

// Stubs the live TVL stat the hook appends, keeping its market-stats query off the mocked-away client.
vi.mock('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData')>()),
  useTokenMarketStats: vi.fn(() => ({ tvl: 1234 })),
}))

const mockClient = vi.mocked(dataApiServiceClientV2)
const mockUseTokenMarketStats = vi.mocked(useTokenMarketStats)
const NOW_S = currentTimeInSeconds()
const VARIABLES = {
  chainId: UniverseChainId.Mainnet,
  address: '0x0000000000000000000000000000000000000001',
  multichain: false,
}

describe(useTDPTVLChartData, () => {
  it('shows the skeleton, not the previous period, while a newly selected period loads', async () => {
    mockClient.getTokenHistoryTVL.mockResolvedValueOnce(
      new GetTokenHistoryTVLResponse({
        points: [3, 2, 1].map((hoursAgo) => ({ timestamp: BigInt(NOW_S - hoursAgo * 3600), tvlUsd: 100 })),
      }),
    )
    const { result, rerender } = renderHook(
      ({ duration }) => useTDPTVLChartData({ variables: { ...VARIABLES, duration }, skip: false }),
      { initialProps: { duration: HistoryDuration.Day } },
    )
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.dataQuality).toBe(DataQuality.VALID)

    mockClient.getTokenHistoryTVL.mockReturnValueOnce(new Promise<never>(() => {}))
    rerender({ duration: HistoryDuration.Week })

    expect(result.current).toMatchObject({ entries: [], loading: true, dataQuality: DataQuality.INVALID })
  })

  it('reads the live TVL for the native currency, without the previous token stats, when the chart target has no address', async () => {
    mockClient.getTokenHistoryTVL.mockResolvedValueOnce(
      new GetTokenHistoryTVLResponse({
        points: [3, 2, 1].map((hoursAgo) => ({ timestamp: BigInt(NOW_S - hoursAgo * 3600), tvlUsd: 100 })),
      }),
    )
    // The native token has no DB address on mainnet, which is how the TDP builds its chart variables.
    const { result } = renderHook(() =>
      useTDPTVLChartData({
        variables: { ...VARIABLES, address: undefined, duration: HistoryDuration.Day },
        skip: false,
      }),
    )
    await waitFor(() => expect(result.current.loading).toBe(false))

    // Deliberately literal, not derived from the code under test.
    expect(mockUseTokenMarketStats).toHaveBeenCalledWith('1-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', {
      isMultichainAggregateView: false,
      keepPreviousData: false,
    })
    expect(result.current.entries.at(-1)?.values).toEqual([1234])
  })
})
