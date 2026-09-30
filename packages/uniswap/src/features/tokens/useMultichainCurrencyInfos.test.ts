import { type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { waitFor } from '@testing-library/react-native'
import type { MultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { SharedQueryClient } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/rpc'
import {
  useMultichainCurrencyInfos,
  useMultichainCurrencyInfosByCurrencyId,
  useMultichainCurrencyInfosWithoutBridgedNatives,
} from 'uniswap/src/features/tokens/useMultichainCurrencyInfos'
import { createRankedMultichainToken } from 'uniswap/src/test/fixtures/dataApi/rankedMultichainToken'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const { mockGetGetTokensMultiChainQueryOptions } = vi.hoisted(() => ({
  mockGetGetTokensMultiChainQueryOptions: vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/dataApiService/tokens/queries', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/data/apiClients/dataApiService/tokens/queries')>()),
  getGetTokensMultiChainQueryOptions: mockGetGetTokensMultiChainQueryOptions,
}))

const USDC_MAINNET_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDC_BASE_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const BRIDGED_ETH_POLYGON_ADDRESS = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619'

const USDC_MAINNET_ID = buildCurrencyId(UniverseChainId.Mainnet, USDC_MAINNET_ADDRESS)
const USDC_BASE_ID = buildCurrencyId(UniverseChainId.Base, USDC_BASE_ADDRESS)
const ETH_MAINNET_ID = buildNativeCurrencyId(UniverseChainId.Mainnet)
const BRIDGED_ETH_POLYGON_ID = buildCurrencyId(UniverseChainId.Polygon, BRIDGED_ETH_POLYGON_ADDRESS)

function multichainToken(overrides: Parameters<typeof createRankedMultichainToken>[0]): PlainMessage<MultichainToken> {
  const token = createRankedMultichainToken(overrides).multichainToken
  if (!token) {
    throw new Error('fixture has no multichainToken')
  }
  return toPlainMessage(token)
}

const USDC = multichainToken({
  multichainId: 'usdc',
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  addresses: { [UniverseChainId.Mainnet]: USDC_MAINNET_ADDRESS, [UniverseChainId.Base]: USDC_BASE_ADDRESS },
})

// Real shape of the ETH asset: native on Mainnet (served under the zero address) plus a bridged
// ERC20 copy on Polygon.
const ETH = multichainToken({
  multichainId: 'eth',
  symbol: 'ETH',
  name: 'Ether',
  decimals: 18,
  addresses: {
    [UniverseChainId.Mainnet]: DEFAULT_NATIVE_ADDRESS,
    [UniverseChainId.Polygon]: BRIDGED_ETH_POLYGON_ADDRESS,
  },
})

function mockResponse(tokens: PlainMessage<MultichainToken>[]): void {
  mockGetGetTokensMultiChainQueryOptions.mockImplementation(({ enabled, select }) => ({
    queryKey: [ReactQueryCacheKey.DataApiService, 'getTokensMultiChain', tokens.map((t) => t.multichainId)],
    queryFn: () => Promise.resolve({ tokens }),
    enabled,
    select,
  }))
}

function currencyIdsOf(currencyInfos: { currencyId: string }[] | undefined): string[] | undefined {
  return currencyInfos?.map((currencyInfo) => currencyInfo.currencyId)
}

beforeEach(() => {
  vi.clearAllMocks()
  SharedQueryClient.clear()
})

describe(useMultichainCurrencyInfos, () => {
  it('expands each asset to a CurrencyInfo per chain deployment', async () => {
    mockResponse([USDC])
    const { result } = renderHookWithProviders(() => useMultichainCurrencyInfos([USDC_MAINNET_ID]))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(currencyIdsOf(result.current.data)).toEqual([USDC_MAINNET_ID, USDC_BASE_ID])
    expect(result.current.data?.[0]?.currency.symbol).toBe('USDC')
  })

  it('does not fetch when no currencyIds are requested', () => {
    mockResponse([])
    renderHookWithProviders(() => useMultichainCurrencyInfos([]))

    expect(mockGetGetTokensMultiChainQueryOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('does not fetch when skipped', () => {
    mockResponse([USDC])
    renderHookWithProviders(() => useMultichainCurrencyInfos([USDC_MAINNET_ID], { skip: true }))

    expect(mockGetGetTokensMultiChainQueryOptions).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })
})

describe(useMultichainCurrencyInfosWithoutBridgedNatives, () => {
  it('keeps only native deployments for native assets and every deployment for tokens', async () => {
    mockResponse([ETH, USDC])
    const { result } = renderHookWithProviders(() =>
      useMultichainCurrencyInfosWithoutBridgedNatives([ETH_MAINNET_ID, USDC_MAINNET_ID]),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(currencyIdsOf(result.current.data)).toEqual([ETH_MAINNET_ID, USDC_MAINNET_ID, USDC_BASE_ID])
    expect(currencyIdsOf(result.current.data)).not.toContain(BRIDGED_ETH_POLYGON_ID)
  })
})

describe(useMultichainCurrencyInfosByCurrencyId, () => {
  it('maps each requested currencyId to every deployment of its asset', async () => {
    mockResponse([ETH, USDC])
    const { result } = renderHookWithProviders(() =>
      useMultichainCurrencyInfosByCurrencyId([USDC_BASE_ID, ETH_MAINNET_ID]),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(currencyIdsOf(result.current.data?.get(USDC_BASE_ID))).toEqual([USDC_MAINNET_ID, USDC_BASE_ID])
    expect(currencyIdsOf(result.current.data?.get(ETH_MAINNET_ID))).toEqual([ETH_MAINNET_ID, BRIDGED_ETH_POLYGON_ID])
    expect(result.current.data?.has(USDC_MAINNET_ID)).toBe(false)
  })
})
