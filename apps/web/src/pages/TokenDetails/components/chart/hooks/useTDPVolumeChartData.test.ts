import { onlineManager } from '@tanstack/react-query'
import { GetTokenHistoryVolumeResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { GraphQLApi } from '@universe/api'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { DataQuality } from '~/components/Charts/utils'
import { useTDPVolumeChartData } from '~/pages/TokenDetails/components/chart/hooks/useTDPVolumeChartData'
import { renderHook, waitFor } from '~/test-utils/render'

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: { getTokenHistoryVolume: vi.fn() },
}))

const mockClient = vi.mocked(dataApiServiceClientV2)
const NOW_S = Math.floor(Date.now() / 1000)

// The test QueryClient is shared across this file, so each test gets its own token to keep keys apart.
let tokenIndex = 0
function nextVariables(duration: HistoryDuration) {
  tokenIndex += 1
  return {
    chain: GraphQLApi.Chain.Ethereum,
    address: `0x${String(tokenIndex).padStart(40, '0')}`,
    duration,
    multichain: false,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
})

afterEach(() => {
  onlineManager.setOnline(true)
})

describe(useTDPVolumeChartData, () => {
  it('shows the skeleton, not the previous period, while a newly selected period loads', async () => {
    mockClient.getTokenHistoryVolume.mockResolvedValueOnce(
      new GetTokenHistoryVolumeResponse({
        buckets: [3, 2, 1].map((hoursAgo) => ({ timestamp: BigInt(NOW_S - hoursAgo * 3600), volumeUsd: 100 })),
      }),
    )
    const variables = nextVariables(HistoryDuration.Day)
    const { result, rerender } = renderHook(
      ({ duration }) => useTDPVolumeChartData({ variables: { ...variables, duration }, skip: false }),
      { initialProps: { duration: HistoryDuration.Day } },
    )
    await waitFor(() => expect(result.current.entries).toHaveLength(3))
    expect(result.current.loading).toBe(false)

    mockClient.getTokenHistoryVolume.mockReturnValueOnce(new Promise<never>(() => {}))
    rerender({ duration: HistoryDuration.Week })

    expect(result.current).toMatchObject({ entries: [], loading: true, dataQuality: DataQuality.INVALID })
  })

  it('keeps the skeleton while paused offline and loads on reconnect', async () => {
    onlineManager.setOnline(false)
    mockClient.getTokenHistoryVolume.mockResolvedValueOnce(
      new GetTokenHistoryVolumeResponse({ buckets: [{ timestamp: BigInt(NOW_S - 3600), volumeUsd: 100 }] }),
    )
    const variables = nextVariables(HistoryDuration.Day)
    const { result } = renderHook(() => useTDPVolumeChartData({ variables, skip: false }))

    expect(result.current).toMatchObject({ entries: [], loading: true })
    expect(mockClient.getTokenHistoryVolume).not.toHaveBeenCalled()

    onlineManager.setOnline(true)
    await waitFor(() => expect(result.current.entries).toHaveLength(1))
    expect(result.current.loading).toBe(false)
  })

  it('does not report a skipped query as loading', () => {
    const variables = nextVariables(HistoryDuration.Day)
    const { result } = renderHook(() => useTDPVolumeChartData({ variables, skip: true }))

    expect(result.current).toMatchObject({ entries: [], loading: false })
    expect(mockClient.getTokenHistoryVolume).not.toHaveBeenCalled()
  })
})
