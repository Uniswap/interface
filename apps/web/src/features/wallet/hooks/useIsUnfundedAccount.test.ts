import { Token } from '@uniswap/sdk-core'
import { UniverseChainId, normalizeTokenAddressForCache } from '@universe/chains'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import type {
  CurrencyInfo,
  PortfolioChainBalance,
  PortfolioMultichainBalance,
} from 'uniswap/src/features/dataApi/types'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useSortedPortfolioBalancesMultichain } from 'uniswap/src/features/portfolio/balances/hooks'
import {
  createPortfolioChainBalance,
  createPortfolioMultichainBalance,
} from 'uniswap/src/test/fixtures/dataApi/portfolioMultichainBalances'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { assume0xAddress } from '~/chains'
import { useActiveAddresses } from '~/connection/accounts/hooks'
import { useIsUnfundedAccount } from '~/features/wallet/hooks/useIsUnfundedAccount'
import { TEST_TOKEN_1_INFO, TEST_TOKEN_2_INFO } from '~/test-utils/constants'
import { renderHook } from '~/test-utils/render'

vi.mock('~/connection/accounts/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/connection/accounts/hooks')>()),
  useActiveAddresses: vi.fn(),
}))

const testnetMode = vi.hoisted(() => ({ enabled: false }))

// Only the testnet flag is overridden; the test providers read the real enabled chains
vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/chains/hooks/useEnabledChains')>()
  return {
    ...actual,
    useEnabledChains: (...args: Parameters<typeof actual.useEnabledChains>) => ({
      ...actual.useEnabledChains(...args),
      isTestnetModeEnabled: testnetMode.enabled,
    }),
  }
})

vi.mock('uniswap/src/features/dataApi/balances/balancesRest', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/dataApi/balances/balancesRest')>()),
  usePortfolioTotalValue: vi.fn(),
}))

vi.mock('uniswap/src/features/portfolio/balances/hooks', () => ({
  useSortedPortfolioBalancesMultichain: vi.fn(),
}))

vi.mock('uniswap/src/features/earn/hooks/useEarnVaults', () => ({
  useEarnVaults: vi.fn(),
}))

const mockUseActiveAddresses = vi.mocked(useActiveAddresses)
const mockUsePortfolioTotalValue = vi.mocked(usePortfolioTotalValue)
const mockUseSortedPortfolioBalancesMultichain = vi.mocked(useSortedPortfolioBalancesMultichain)
const mockUseEarnVaults = vi.mocked(useEarnVaults)

const ACTIVE_EVM_ADDRESS = assume0xAddress('0xF030EaA01aFf57A23483dC8A1c3550d153be69Fb')

const VAULT_SHARE_ADDRESS = '0x8c106EEDAd96553e64287A5A6839c3Cc78afA3D0'
const VAULT_SHARE_INFO: CurrencyInfo = {
  currency: new Token(UniverseChainId.Mainnet, VAULT_SHARE_ADDRESS, 18, 'gtUSDC', 'Gauntlet USDC Prime'),
  currencyId: buildCurrencyId(UniverseChainId.Mainnet, VAULT_SHARE_ADDRESS),
  logoUrl: null,
}
const EARN_VAULT: EarnVaultInfo = {
  id: `1-${normalizeTokenAddressForCache(VAULT_SHARE_ADDRESS)}`,
  currencyId: buildCurrencyId(UniverseChainId.Mainnet, USDC_MAINNET.address),
  displayCurrencyId: buildCurrencyId(UniverseChainId.Mainnet, USDC_MAINNET.address),
  vaultAddress: VAULT_SHARE_ADDRESS,
  chainId: UniverseChainId.Mainnet,
  apyPercent: 4,
  exposureCurrencyIds: [buildCurrencyId(UniverseChainId.Mainnet, USDC_MAINNET.address)],
  exposures: [],
  totalDepositsUsd: 1_000_000,
  liquidityUsd: 1_000_000,
  curator: { name: 'Gauntlet' },
}

function chainBalance(
  currencyInfo: CurrencyInfo,
  overrides: Partial<PortfolioChainBalance> = {},
): PortfolioChainBalance {
  const currency = currencyInfo.currency as Token
  return createPortfolioChainBalance({
    chainId: currency.chainId,
    address: currency.address,
    decimals: currency.decimals,
    quantity: 1,
    valueUsd: 0,
    isHidden: false,
    currencyInfo,
    ...overrides,
  })
}

function multichainBalance(id: string, tokens: PortfolioChainBalance[], isHidden = false): PortfolioMultichainBalance {
  return createPortfolioMultichainBalance(
    {
      id,
      name: 'Test Token',
      symbol: 'TEST',
      logoUrl: null,
      totalAmount: 1,
      priceUsd: 0,
      pricePercentChange1d: null,
      totalValueUsd: 0,
      isHidden,
      tokens,
    },
    { cacheOwnerSuffix: ACTIVE_EVM_ADDRESS },
  )
}

function mockBalances({
  balances = [],
  hiddenBalances = [],
}: {
  balances?: PortfolioMultichainBalance[]
  hiddenBalances?: PortfolioMultichainBalance[]
}): void {
  mockUseSortedPortfolioBalancesMultichain.mockReturnValue({
    data: { balances, hiddenBalances },
    loading: false,
  } as unknown as ReturnType<typeof useSortedPortfolioBalancesMultichain>)
}

function mockBalanceUSD(balanceUSD: number | undefined): void {
  mockUsePortfolioTotalValue.mockReturnValue({
    data: balanceUSD === undefined ? undefined : { balanceUSD, percentChange: 0, absoluteChangeUSD: 0 },
  } as ReturnType<typeof usePortfolioTotalValue>)
}

function mockVaults(vaults: EarnVaultInfo[], isLoadingVaults = false): void {
  mockUseEarnVaults.mockReturnValue({ vaults, isLoadingVaults } as unknown as ReturnType<typeof useEarnVaults>)
}

describe('useIsUnfundedAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseActiveAddresses.mockReturnValue({ evmAddress: ACTIVE_EVM_ADDRESS, svmAddress: undefined })
    testnetMode.enabled = false
    mockBalanceUSD(0)
    mockBalances({})
    mockVaults([])
  })

  it('is true for a zero balance with no hidden tokens', () => {
    const { result } = renderHook(() => useIsUnfundedAccount())

    expect(result.current).toBe(true)
  })

  it('reads the connected account', () => {
    renderHook(() => useIsUnfundedAccount())

    expect(mockUsePortfolioTotalValue).toHaveBeenCalledWith({ evmAddress: ACTIVE_EVM_ADDRESS, svmAddress: undefined })
    expect(mockUseSortedPortfolioBalancesMultichain).toHaveBeenCalledWith(
      expect.objectContaining({ evmAddress: ACTIVE_EVM_ADDRESS, svmAddress: undefined }),
    )
  })

  it('is false for a non-zero balance', () => {
    mockBalanceUSD(12.5)

    const { result } = renderHook(() => useIsUnfundedAccount())

    expect(result.current).toBe(false)
  })

  it('is false while the balance is unknown', () => {
    mockBalanceUSD(undefined)

    const { result } = renderHook(() => useIsUnfundedAccount())

    expect(result.current).toBe(false)
  })

  it('is false in testnet mode', () => {
    testnetMode.enabled = true

    const { result } = renderHook(() => useIsUnfundedAccount())

    expect(result.current).toBe(false)
  })

  it('is false when the account holds a fully hidden token', () => {
    mockBalances({
      hiddenBalances: [multichainBalance('hidden', [chainBalance(TEST_TOKEN_1_INFO, { isHidden: true })], true)],
    })

    const { result } = renderHook(() => useIsUnfundedAccount())

    expect(result.current).toBe(false)
  })

  it('is false when a visible token has a hidden chain', () => {
    mockBalances({
      balances: [
        multichainBalance('partial', [
          chainBalance(TEST_TOKEN_1_INFO, { chainId: UniverseChainId.Mainnet }),
          chainBalance(TEST_TOKEN_2_INFO, { chainId: UniverseChainId.ArbitrumOne, isHidden: true }),
        ]),
      ],
    })

    const { result } = renderHook(() => useIsUnfundedAccount())

    expect(result.current).toBe(false)
  })

  it('ignores hidden Earn vault shares', () => {
    mockVaults([EARN_VAULT])
    mockBalances({
      hiddenBalances: [multichainBalance('vault', [chainBalance(VAULT_SHARE_INFO, { isHidden: true })], true)],
    })

    const { result } = renderHook(() => useIsUnfundedAccount())

    expect(result.current).toBe(true)
  })
})
