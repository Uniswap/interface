import { type QueryKey, useQueryClient } from '@tanstack/react-query'
import { HistoryDuration as RestHistoryDuration } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import {
  getGetTokenHistoryOHLCQueryOptions,
  getGetTokenHistoryTVLQueryOptions,
  getGetTokenHistoryVolumeQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { type HistoryTarget, toHistoryTarget } from 'uniswap/src/features/dataApi/tokenDetails/useTokenPriceHistoryRest'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { ChartType, PriceChartType } from '~/components/Charts/utils'
import { TimePeriod } from '~/data/util'
import { usePrefetchTDPChartHistory } from '~/pages/TokenDetails/components/chart/hooks/usePrefetchTDPChartHistory'
import type { TokenDetailsChartType } from '~/pages/TokenDetails/components/chart/TDPChartState'
import { getTdpTokenPriceHistoryQueryOptions } from '~/pages/TokenDetails/tdpTokenQueryOptions'
import { act, renderHook } from '~/test-utils/render'

const mockClient = vi.hoisted(() => ({
  getTokenHistoryVolume: vi.fn(),
  getTokenHistoryTVL: vi.fn(),
  getTokenHistoryOHLC: vi.fn(),
  getTokenHistoryPrice: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: mockClient,
}))

const PENDING_FOREVER = new Promise<never>(() => {})

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

function targetFor(address: string): HistoryTarget {
  return toHistoryTarget({ chainId: UniverseChainId.Mainnet, address, multichain: false })
}

function renderPrefetch({
  chartType,
  displayPriceChartType,
}: {
  chartType: TokenDetailsChartType
  displayPriceChartType: PriceChartType
}) {
  const variables = nextVariables(HistoryDuration.Day)
  const { result } = renderHook(() => ({
    prefetch: usePrefetchTDPChartHistory({ variables, chartType, displayPriceChartType }),
    queryClient: useQueryClient(),
  }))
  return { ...result.current, target: targetFor(variables.address) }
}

const PREFETCH_CASES: {
  label: string
  chartType: TokenDetailsChartType
  displayPriceChartType: PriceChartType
  method: keyof typeof mockClient
  keyFor: (target: HistoryTarget) => QueryKey
}[] = [
  {
    label: 'volume',
    chartType: ChartType.VOLUME,
    displayPriceChartType: PriceChartType.LINE,
    method: 'getTokenHistoryVolume',
    keyFor: (target: HistoryTarget) =>
      getGetTokenHistoryVolumeQueryOptions({ params: { target, duration: RestHistoryDuration.WEEK } }).queryKey,
  },
  {
    label: 'tvl',
    chartType: ChartType.TVL,
    displayPriceChartType: PriceChartType.LINE,
    method: 'getTokenHistoryTVL',
    keyFor: (target: HistoryTarget) =>
      getGetTokenHistoryTVLQueryOptions({ params: { target, duration: RestHistoryDuration.WEEK } }).queryKey,
  },
  {
    label: 'candlestick price',
    chartType: ChartType.PRICE,
    displayPriceChartType: PriceChartType.CANDLESTICK,
    method: 'getTokenHistoryOHLC',
    keyFor: (target: HistoryTarget) =>
      getGetTokenHistoryOHLCQueryOptions({ params: { target, duration: RestHistoryDuration.WEEK } }).queryKey,
  },
  {
    label: 'line price',
    chartType: ChartType.PRICE,
    displayPriceChartType: PriceChartType.LINE,
    method: 'getTokenHistoryPrice',
    keyFor: (target: HistoryTarget) =>
      getTdpTokenPriceHistoryQueryOptions({ target, duration: HistoryDuration.Week }).queryKey,
  },
]

beforeEach(() => {
  vi.resetAllMocks()
})

describe(usePrefetchTDPChartHistory, () => {
  it.each(PREFETCH_CASES)(
    'warms the $label key the panel reads for the hovered period',
    ({ chartType, displayPriceChartType, method, keyFor }) => {
      mockClient[method].mockReturnValue(PENDING_FOREVER)
      const { prefetch, queryClient, target } = renderPrefetch({ chartType, displayPriceChartType })

      act(() => prefetch(TimePeriod.WEEK))

      expect(queryClient.getQueryState(keyFor(target))?.fetchStatus).toBe('fetching')
      expect(mockClient[method]).toHaveBeenCalledTimes(1)
    },
  )

  it('does nothing for the period already on screen', () => {
    const { prefetch } = renderPrefetch({ chartType: ChartType.VOLUME, displayPriceChartType: PriceChartType.LINE })

    act(() => prefetch(TimePeriod.DAY))

    expect(mockClient.getTokenHistoryVolume).not.toHaveBeenCalled()
  })
})
