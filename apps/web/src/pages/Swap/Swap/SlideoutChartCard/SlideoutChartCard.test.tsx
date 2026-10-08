import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GetTokenHistoryPriceResponse, GetTokenResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HistoryDuration as RestHistoryDuration } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { nativeOnChain, UNI, WBTC } from 'uniswap/src/constants/tokens'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { SlideoutChartCard } from '~/pages/Swap/Swap/SlideoutChartCard/SlideoutChartCard'
import { act, fireEvent, render, screen, waitFor } from '~/test-utils/render'

vi.mock('uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2', () => ({
  dataApiServiceClientV2: { getToken: vi.fn(), getTokenHistoryPrice: vi.fn() },
}))

let mockCurrencies: { inputCurrency: Currency | undefined; outputCurrency: Currency | undefined }
vi.mock('~/pages/Swap/Swap/SlideoutChartCard/useSlideoutChartCardCurrencies', () => ({
  useSlideoutChartCardCurrencies: () => mockCurrencies,
}))

vi.mock('~/features/Swap/state/useSwapContext', () => ({
  useSwapAndLimitContext: () => ({ currentTab: SwapTab.Swap }),
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({ useCurrencyInfo: () => undefined }))
vi.mock('~/hooks/useColor', () => ({ useColor: () => '#000000' }))
vi.mock('~/components/Charts/hooks/useChartAnimatedColor', () => ({ useChartAnimatedColor: (color: string) => color }))
vi.mock('~/pages/Portfolio/Tokens/hooks/useNavigateToTokenDetails', () => ({
  useNavigateToTokenDetails: () => vi.fn(),
}))
vi.mock('uniswap/src/data/apiClients/dataApiService/categories/useTokenCategories', () => ({
  getTokenCategoryIdsQueryOptions: () => ({ queryKey: ['test-token-categories'], queryFn: () => [] }),
}))

// Surface exactly what the card hands to the chart and the header so the test can read it from the DOM.
vi.mock('~/components/Charts/PriceChart', () => ({
  PriceChartBody: ({ data }: { data: { value: number }[] }) => (
    <div data-testid="chart-values">{data.map((entry) => entry.value).join(',')}</div>
  ),
}))
vi.mock('uniswap/src/components/AnimatedNumber/AnimatedNumber', () => ({
  // The delta row also renders AnimatedNumber; only the header price uses the heading3 variant.
  default: ({ numericValue, textVariant }: { numericValue: number; textVariant?: string }) =>
    textVariant === '$heading3' ? <div data-testid="header-price">{numericValue}</div> : null,
}))

const mockClient = vi.mocked(dataApiServiceClientV2)

const ETH = nativeOnChain(UniverseChainId.Mainnet)

// Deliberately far apart so any cross-token mixing is unambiguous.
const ETH_SERIES = [3000, 3010, 3020]
const BTC_SERIES = [81000, 81100, 81200]
const ETH_SPOT = 3030
const BTC_SPOT = 81442.78

const NOW_SECONDS = Math.floor(Date.now() / 1000)
const T = [NOW_SECONDS - 3000, NOW_SECONDS - 2000, NOW_SECONDS - 1000]

function isWbtcRequest(params: unknown): boolean {
  return JSON.stringify(params, (_key, value: unknown) => (typeof value === 'bigint' ? String(value) : value))
    .toLowerCase()
    .includes(WBTC.address.toLowerCase())
}

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
}
function defer<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const tokenResponse = (spotUsd: number): GetTokenResponse =>
  new GetTokenResponse({ token: { price: { spotUsd, percentChange1d: 1 } } })

const historyResponse = (values: number[]): GetTokenHistoryPriceResponse =>
  new GetTokenHistoryPriceResponse({
    points: values.map((priceUsd, i) => ({ timestamp: BigInt(T[i]), priceUsd })),
  })

function renderCard(): ReturnType<typeof render> {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <SlideoutChartCard isChartOpen />
    </QueryClientProvider>,
  )
}

// The token row above the chart repeats the selected symbol, so the pill is the last match.
function clickTokenPill(symbol: string): void {
  const pill = screen.getAllByText(symbol).at(-1)
  if (!pill) {
    throw new Error(`No ${symbol} pill rendered`)
  }
  fireEvent.click(pill)
}

function readChartValues(): number[] | undefined {
  const text = screen.queryByTestId('chart-values')?.textContent
  return text ? text.split(',').map(Number) : undefined
}

function readHeaderPrice(): number | undefined {
  const text = screen.queryByTestId('header-price')?.textContent
  return text ? Number(text) : undefined
}

const isEthScale = (value: number): boolean => value < 10_000
const isBtcScale = (value: number): boolean => value >= 10_000

describe('SlideoutChartCard token toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrencies = { inputCurrency: ETH, outputCurrency: WBTC }
  })

  it('does not show the previous token spot price on the chart after toggling back to a native token', async () => {
    mockClient.getToken.mockImplementation(async (params) => tokenResponse(isWbtcRequest(params) ? BTC_SPOT : ETH_SPOT))
    mockClient.getTokenHistoryPrice.mockImplementation(async (req) =>
      historyResponse(isWbtcRequest(req) ? BTC_SERIES : ETH_SERIES),
    )

    renderCard()
    await waitFor(() => expect(readChartValues()).toEqual(expect.arrayContaining(ETH_SERIES)))

    clickTokenPill('WBTC')
    await waitFor(() => expect(readChartValues()).toEqual(expect.arrayContaining(BTC_SERIES)))
    await waitFor(() => expect(readHeaderPrice()).toBe(BTC_SPOT))

    clickTokenPill('ETH')
    await waitFor(() => expect(readChartValues()).toEqual(expect.arrayContaining(ETH_SERIES)))

    expect(readChartValues()?.every(isEthScale)).toBe(true)
    expect(readHeaderPrice()).toSatisfy(isEthScale)
  })

  it('never renders the previous token series with the new token spot price while history loads', async () => {
    const btcHistory = defer<GetTokenHistoryPriceResponse>()
    mockClient.getToken.mockImplementation(async (params) => tokenResponse(isWbtcRequest(params) ? BTC_SPOT : ETH_SPOT))
    mockClient.getTokenHistoryPrice.mockImplementation((req) =>
      isWbtcRequest(req) ? btcHistory.promise : Promise.resolve(historyResponse(ETH_SERIES)),
    )

    renderCard()
    await waitFor(() => expect(readChartValues()).toEqual(expect.arrayContaining(ETH_SERIES)))

    clickTokenPill('WBTC')
    await waitFor(() => expect(mockClient.getToken).toHaveBeenCalledTimes(2))
    await act(async () => {
      await Promise.resolve()
    })

    const pendingValues = readChartValues()
    expect(pendingValues?.some(isEthScale) ?? false).toBe(false)
    const pendingPrice = readHeaderPrice()
    expect(pendingPrice === undefined || isBtcScale(pendingPrice)).toBe(true)

    await act(async () => {
      btcHistory.resolve(historyResponse(BTC_SERIES))
    })
    await waitFor(() => expect(readChartValues()).toEqual(expect.arrayContaining(BTC_SERIES)))
    expect(readChartValues()?.every(isBtcScale)).toBe(true)
  })

  it('never renders the previous token spot price on the new token series while spot loads', async () => {
    const btcSpot = defer<GetTokenResponse>()
    mockClient.getToken.mockImplementation((params) =>
      isWbtcRequest(params) ? btcSpot.promise : Promise.resolve(tokenResponse(ETH_SPOT)),
    )
    mockClient.getTokenHistoryPrice.mockImplementation(async (req) =>
      historyResponse(isWbtcRequest(req) ? BTC_SERIES : ETH_SERIES),
    )
    mockCurrencies = { inputCurrency: UNI[UniverseChainId.Mainnet], outputCurrency: WBTC }

    renderCard()
    await waitFor(() => expect(readHeaderPrice()).toBe(ETH_SPOT))

    clickTokenPill('WBTC')
    await waitFor(() => expect(readChartValues()).toEqual(expect.arrayContaining(BTC_SERIES)))

    expect(readChartValues()?.every(isBtcScale)).toBe(true)
    const pendingPrice = readHeaderPrice()
    expect(pendingPrice === undefined || isBtcScale(pendingPrice)).toBe(true)

    await act(async () => {
      btcSpot.resolve(tokenResponse(BTC_SPOT))
    })
    await waitFor(() => expect(readHeaderPrice()).toBe(BTC_SPOT))
  })

  it('keeps the current series visible while a new time period loads for the same token', async () => {
    const weekHistory = defer<GetTokenHistoryPriceResponse>()
    mockClient.getToken.mockImplementation(async () => tokenResponse(BTC_SPOT))
    mockClient.getTokenHistoryPrice.mockImplementation((req) =>
      req.duration === RestHistoryDuration.WEEK ? weekHistory.promise : Promise.resolve(historyResponse(BTC_SERIES)),
    )
    mockCurrencies = { inputCurrency: WBTC, outputCurrency: ETH }

    renderCard()
    await waitFor(() => expect(readChartValues()).toEqual(expect.arrayContaining(BTC_SERIES)))

    fireEvent.click(screen.getByText('1W'))
    await waitFor(() => expect(mockClient.getTokenHistoryPrice).toHaveBeenCalledTimes(2))

    expect(readChartValues()).toEqual(expect.arrayContaining(BTC_SERIES))
  })
})
