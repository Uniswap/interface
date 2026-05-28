import { useQuery } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { Token, TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import {
  EarnPosition as DataApiEarnPosition,
  EarnVault as DataApiEarnVault,
} from '@uniswap/client-data-api/dist/data/v2/earn_pb'
import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import type { TokenQueryData } from '~/appGraphql/data/Token'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { useTokenDetailsEarnData } from '~/pages/TokenDetails/components/earn/useTokenDetailsEarnData'
import type { TDPState } from '~/pages/TokenDetails/context/createTDPStore'
import type { MultiChainMap } from '~/pages/TokenDetails/context/TDPContext'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn(),
  }
})

vi.mock('~/features/accounts/store/hooks', () => ({
  useActiveAddress: vi.fn(),
}))

vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({
  useTDPStore: vi.fn(),
}))

const useQueryMock = vi.mocked(useQuery)
const useActiveAddressMock = vi.mocked(useActiveAddress)
const useTDPStoreMock = vi.mocked(useTDPStore)

const WALLET_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71B54bdA02913'
const VAULT_ADDRESS = '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0'

function mockTDPStore(multiChainMap: MultiChainMap): void {
  useTDPStoreMock.mockImplementation(((selector: (state: TDPState) => unknown) =>
    selector({ multiChainMap } as TDPState)) as typeof useTDPStore)
}

function mockQueryResult<TData>({
  data,
  isSuccess = true,
}: {
  data: TData | undefined
  isSuccess?: boolean
}): ReturnType<typeof useQuery> {
  return {
    data,
    error: null,
    isError: false,
    isSuccess,
  } as unknown as ReturnType<typeof useQuery>
}

function mockEarnQueries({
  positions = [],
  vaults = [createDataApiVault()],
}: {
  positions?: DataApiEarnPosition[]
  vaults?: DataApiEarnVault[]
} = {}): void {
  useQueryMock.mockImplementation(
    ({ queryKey, select }: { queryKey?: readonly unknown[]; select?: (data: unknown) => unknown }) => {
      switch (queryKey?.[1]) {
        case 'listEarnVaults': {
          const data = { vaults }
          return mockQueryResult({ data: select ? select(data) : data })
        }
        case 'listEarnPositions': {
          const data = { positions }
          return mockQueryResult({ data: select ? select(data) : data })
        }
        default:
          return mockQueryResult({ data: undefined, isSuccess: false })
      }
    },
  )
}

function createDataApiVault(overrides: Partial<DataApiEarnVault> = {}): DataApiEarnVault {
  return new DataApiEarnVault({
    address: VAULT_ADDRESS,
    chainId: UniverseChainId.Mainnet,
    name: 'Gauntlet USDC Prime',
    symbol: 'gtUSDCprime',
    underlyingToken: new Token({
      chainId: UniverseChainId.Mainnet,
      address: USDC_ADDRESS,
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
      type: TokenType.ERC20,
    }),
    totalAssetsUsd: 50_000_000,
    liquidityUsd: 5_000_000,
    apy: 0.052,
    netApy: 0.04,
    ...overrides,
  })
}

function createPosition(overrides: Partial<DataApiEarnPosition> = {}): DataApiEarnPosition {
  return new DataApiEarnPosition({
    vault: createDataApiVault(),
    sharesRaw: '1000000',
    currentAssetsUsd: 123.45,
    ...overrides,
  })
}

function createTokenQueryData(): NonNullable<TokenQueryData> {
  return {
    symbol: 'USDC',
    market: {
      price: {
        value: 1,
      },
    },
    project: {
      tokens: [
        {
          chain: GraphQLApi.Chain.Ethereum,
          address: USDC_ADDRESS,
        },
        {
          chain: GraphQLApi.Chain.Base,
          address: BASE_USDC_ADDRESS,
        },
      ],
    },
  } as unknown as NonNullable<TokenQueryData>
}

function createBalance({ balanceUSD, quantity }: { balanceUSD: number; quantity: number }): PortfolioBalance {
  return {
    id: buildCurrencyId(UniverseChainId.Mainnet, USDC_ADDRESS),
    cacheId: buildCurrencyId(UniverseChainId.Mainnet, USDC_ADDRESS),
    quantity,
    balanceUSD,
    currencyInfo: undefined,
    relativeChange24: undefined,
    isHidden: undefined,
  } as unknown as PortfolioBalance
}

describe(useTokenDetailsEarnData, () => {
  beforeEach(() => {
    useQueryMock.mockReset()
    useActiveAddressMock.mockReturnValue(WALLET_ADDRESS)
    mockTDPStore({})
  })

  it('returns a matching earn vault for logged-in users even without a token balance', () => {
    mockEarnQueries()

    const { result } = renderHook(() =>
      useTokenDetailsEarnData({ enabled: true, tokenQueryData: createTokenQueryData() }),
    )

    expect(result.current.balanceUsd).toBeUndefined()
    expect(result.current.earnVault?.vaultAddress).toBe(VAULT_ADDRESS)
    expect(result.current.hasLoadedPositions).toBe(true)
    expect(result.current.isLoggedIn).toBe(true)
    expect(result.current.projectedAnnualEarningsUsd).toBe(0)
    expect(result.current.tokenSymbol).toBe('USDC')
    expect(result.current.userHasEarnPosition).toBe(false)
  })

  it('aggregates token balances and detects an existing earn position', () => {
    mockTDPStore({
      [GraphQLApi.Chain.Ethereum]: {
        address: USDC_ADDRESS,
        balance: createBalance({ quantity: 100, balanceUSD: 100 }),
      },
      [GraphQLApi.Chain.Base]: {
        address: BASE_USDC_ADDRESS,
        balance: createBalance({ quantity: 500, balanceUSD: 500 }),
      },
    })
    mockEarnQueries({ positions: [createPosition()] })

    const { result } = renderHook(() =>
      useTokenDetailsEarnData({ enabled: true, tokenQueryData: createTokenQueryData() }),
    )

    expect(result.current.balanceUsd).toBe(600)
    expect(result.current.earnPosition?.depositedUsd).toBe(123.45)
    expect(result.current.projectedAnnualEarningsUsd).toBe(24)
    expect(result.current.userHasEarnPosition).toBe(true)
  })
})
