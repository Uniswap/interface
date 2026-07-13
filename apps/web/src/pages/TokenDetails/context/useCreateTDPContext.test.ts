import { GraphQLApi } from '@universe/api'
import { useLocation, useParams } from 'react-router'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useCreateTDPContext } from '~/pages/TokenDetails/context/useCreateTDPContext'
import { mocked } from '~/test-utils/mocked'
import { renderHook as renderHookWithProviders } from '~/test-utils/render'
import { createMockTDPChartState } from '~/test-utils/tokenDetails/fixtures'
import { validTokenProjectResponse } from '~/test-utils/tokens/fixtures'

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return {
    ...actual,
    useParams: vi.fn(),
    useLocation: vi.fn(),
  }
})

vi.mock('@universe/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/api')>()
  return {
    ...actual,
    GraphQLApi: {
      ...actual.GraphQLApi,
      useTokenWebQuery: vi.fn(),
      useTokenProjectWebQuery: vi.fn(),
    },
  }
})

vi.mock('@universe/gating', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useFeatureFlag: vi.fn(() => false),
  }
})

vi.mock('~/utils/params/chainParams', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/utils/params/chainParams')>()
  return {
    ...actual,
    useChainIdFromUrlParam: vi.fn(() => UniverseChainId.Mainnet),
  }
})

const mockChartState = createMockTDPChartState()

vi.mock('~/pages/TokenDetails/components/chart/TDPChartState', () => ({
  useCreateTDPChartState: vi.fn(() => mockChartState),
}))

vi.mock('ui/src', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ui/src')>()
  return {
    ...actual,
    useSporeColors: vi.fn(() => ({ surface2: { val: '#000000' } })),
  }
})

vi.mock('~/hooks/useColor', () => ({
  useSrcColor: vi.fn(() => ({ tokenColor: undefined })),
}))

vi.mock('~/features/accounts/store/hooks', () => ({
  useActiveAddresses: vi.fn(() => ({ evmAddress: undefined, svmAddress: undefined })),
  useActiveWallet: vi.fn(() => undefined),
  useConnectionStatus: vi.fn(() => ({
    isConnected: false,
    isConnecting: false,
    isDisconnected: true,
  })),
}))

vi.mock('uniswap/src/features/portfolio/balances/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/portfolio/balances/hooks')>()
  return {
    ...actual,
    usePortfolioBalances: vi.fn(() => ({ data: undefined, error: undefined })),
  }
})

describe('useCreateTDPContext', () => {
  beforeEach(() => {
    mocked(useParams).mockReturnValue({
      tokenAddress: USDC_MAINNET.address,
      chainName: 'ethereum',
    })
    mocked(useLocation).mockReturnValue({
      pathname: '/explore/tokens/ethereum/0x123',
      state: null,
      key: '',
      search: '',
      hash: '',
    } as ReturnType<typeof useLocation>)
    vi.mocked(GraphQLApi.useTokenWebQuery).mockReturnValue({
      data: validTokenProjectResponse.data,
      loading: false,
      error: undefined,
    } as ReturnType<typeof GraphQLApi.useTokenWebQuery>)
    // `currency`, `multiChainMap` and `tokenColor` now derive from the lightweight metadata query.
    vi.mocked(GraphQLApi.useTokenProjectWebQuery).mockReturnValue({
      data: validTokenProjectResponse.data,
      loading: false,
      error: undefined,
    } as ReturnType<typeof GraphQLApi.useTokenProjectWebQuery>)
    vi.mocked(usePortfolioBalances).mockReturnValue({
      data: undefined,
      error: undefined,
    } as ReturnType<typeof usePortfolioBalances>)
  })

  it('throws when tokenAddress URL param is undefined', () => {
    mocked(useParams).mockReturnValue({
      tokenAddress: undefined,
      chainName: 'ethereum',
    })

    expect(() => renderHookWithProviders(() => useCreateTDPContext())).toThrow(
      'Invalid token details route: token address URL param is undefined',
    )
  })

  it('returns object with required TDP context keys', () => {
    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    expect(result.current.state).toMatchObject({
      currency: expect.anything(),
      currencyChain: GraphQLApi.Chain.Ethereum,
      currencyChainId: UniverseChainId.Mainnet,
      address: expect.any(String),
      tokenQuery: expect.anything(),
      tokenProjectQuery: expect.anything(),
      multiChainMap: expect.any(Object),
      balanceError: undefined,
      selectedMultichainChainId: undefined,
    })
    expect(Object.keys(result.current.state)).toContain('tokenColor')
  })

  it('returns PendingTDPContext (currency undefined) when token query has no data', () => {
    vi.mocked(GraphQLApi.useTokenWebQuery).mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    } as ReturnType<typeof GraphQLApi.useTokenWebQuery>)
    vi.mocked(GraphQLApi.useTokenProjectWebQuery).mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    } as ReturnType<typeof GraphQLApi.useTokenProjectWebQuery>)

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    expect(result.current.state.currency).toBeUndefined()
    expect(result.current.state.address).toBe(USDC_MAINNET.address)
    expect(result.current.state.tokenQuery.loading).toBe(true)
    expect(result.current.state.tokenProjectQuery.loading).toBe(true)
  })

  it('returns LoadedTDPContext (currency defined) when token query has data', () => {
    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    expect(result.current.state.currency).toBeDefined()
    expect(result.current.state.currency?.symbol).toBe('USDC')
    expect(result.current.state.currency?.chainId).toBe(UniverseChainId.Mainnet)
    expect(result.current.state.address).toBe(USDC_MAINNET.address)
  })

  it('returns native currency when tokenAddress is NATIVE_CHAIN_ID', () => {
    mocked(useParams).mockReturnValue({
      tokenAddress: NATIVE_CHAIN_ID,
      chainName: 'ethereum',
    })
    vi.mocked(GraphQLApi.useTokenWebQuery).mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    } as ReturnType<typeof GraphQLApi.useTokenWebQuery>)

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    expect(result.current.state.currency).toBeDefined()
    expect(result.current.state.currency?.isNative).toBe(true)
    expect(result.current.state.address).toBe(NATIVE_CHAIN_ID)
  })

  it('exposes the raw balance query error for stale balance UI decisions', () => {
    vi.mocked(usePortfolioBalances).mockReturnValue({
      data: undefined,
      error: new Error('Network error'),
    } as ReturnType<typeof usePortfolioBalances>)

    const { result } = renderHookWithProviders(() => useCreateTDPContext())

    expect(result.current.state.balanceError).toEqual(expect.any(Error))
  })
})
