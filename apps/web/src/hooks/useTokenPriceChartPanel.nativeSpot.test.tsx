import {
  GetTokenHistoryPriceResponse,
  GetTokenMultiChainResponse,
  GetTokenResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { UniverseChainId } from '@universe/chains'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { currentTimeInSeconds } from 'utilities/src/time/time'
import { TimePeriod } from '~/data/util'
import { useTokenPriceChartPanel } from '~/hooks/useTokenPriceChartPanel'
import { renderHook, waitFor } from '~/test-utils/render'
import { PriceChartType } from '~/utils/charts'
import { getChartCurrencyId } from '~/utils/tokenQueryOptions'

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: { getToken: vi.fn(), getTokenMultiChain: vi.fn(), getTokenHistoryPrice: vi.fn() },
}))

const mockClient = vi.mocked(dataApiServiceClientV2)

// Deliberately literal, not derived from the code under test.
const UNI_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
const NATIVE_ETH_ID = '1-0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
// How the v2 data API indexes native ETH.
const NATIVE_REST_ADDRESS = '0x0000000000000000000000000000000000000000'
const UNI_SPOT = 7.71
const ETH_SPOT = 2400

const NOW_SECONDS = currentTimeInSeconds()
const ETH_HISTORY = [
  { timestamp: BigInt(NOW_SECONDS - 3000), priceUsd: 2300 },
  { timestamp: BigInt(NOW_SECONDS - 2000), priceUsd: 2350 },
  { timestamp: BigInt(NOW_SECONDS - 1000), priceUsd: 2390 },
]

type ChartTarget = { chainId: UniverseChainId; address: string | undefined; duration: HistoryDuration }

const uniVariables: ChartTarget = {
  chainId: UniverseChainId.Mainnet,
  address: UNI_ADDRESS,
  duration: HistoryDuration.Day,
}
// The native token has no DB address on mainnet, which is how the TDP builds its chart variables.
const nativeVariables: ChartTarget = {
  chainId: UniverseChainId.Mainnet,
  address: undefined,
  duration: HistoryDuration.Day,
}

function mockResponses(): void {
  mockClient.getToken.mockImplementation(async (request) => {
    const isNative = request.address === NATIVE_REST_ADDRESS
    return new GetTokenResponse({ token: { price: { spotUsd: isNative ? ETH_SPOT : UNI_SPOT } } })
  })
  mockClient.getTokenMultiChain.mockImplementation(async (request) => {
    const identifier = request.identifier?.case === 'token' ? request.identifier.value : undefined
    const isNative = identifier?.address === NATIVE_REST_ADDRESS
    return new GetTokenMultiChainResponse({ token: { price: { spotUsd: isNative ? ETH_SPOT : UNI_SPOT } } })
  })
  mockClient.getTokenHistoryPrice.mockImplementation(
    async () => new GetTokenHistoryPriceResponse({ points: ETH_HISTORY }),
  )
}

describe('getChartCurrencyId', () => {
  it('builds the currency id from chain and address for a token', () => {
    expect(getChartCurrencyId({ chainId: UniverseChainId.Mainnet, address: UNI_ADDRESS })).toBe(`1-${UNI_ADDRESS}`)
  })

  it('falls back to the native currency id when the chart target has no address', () => {
    expect(getChartCurrencyId({ chainId: UniverseChainId.Mainnet, address: undefined })).toBe(NATIVE_ETH_ID)
  })
})

describe('useTokenPriceChartPanel spot price for a native token target', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockResponses()
  })

  it.each([
    { multichain: false, label: 'single-chain' },
    { multichain: true, label: 'all-networks' },
  ])(
    'ends the $label chart at the native token spot price after navigating from another token',
    async ({ multichain }) => {
      const { result, rerender } = renderHook(
        ({ variables }: { variables: ChartTarget }) =>
          useTokenPriceChartPanel({
            variables: { ...variables, multichain },
            priceChartType: PriceChartType.LINE,
            timePeriod: TimePeriod.DAY,
            currency: nativeOnChain(UniverseChainId.Mainnet),
            keepPreviousData: false,
          }),
        { initialProps: { variables: uniVariables } },
      )

      await waitFor(() => expect(result.current.priceQuery.entries.at(-1)?.value).toBe(UNI_SPOT))

      rerender({ variables: nativeVariables })

      await waitFor(() => expect(result.current.priceQuery.entries.at(-1)?.value).toBe(ETH_SPOT))
      expect(result.current.priceQuery.entries.map((entry) => entry.value)).not.toContain(UNI_SPOT)
    },
  )
})
