import { GetTokenHistoryTVLResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { GraphQLApi } from '@universe/api'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { DataQuality } from '~/components/Charts/utils'
import { useTDPTVLChartData } from '~/pages/TokenDetails/components/chart/hooks/useTDPTVLChartData'
import { renderHook, waitFor } from '~/test-utils/render'

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: { getTokenHistoryTVL: vi.fn() },
}))

// Stubs the live TVL stat the hook appends, keeping its market-stats query off the mocked-away client.
vi.mock('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData')>()),
  useTokenMarketStats: () => ({ tvl: 1234 }),
}))

const mockClient = vi.mocked(dataApiServiceClientV2)
const NOW_S = Math.floor(Date.now() / 1000)
const VARIABLES = {
  chain: GraphQLApi.Chain.Ethereum,
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
})
