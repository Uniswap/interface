import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  useRestPortfolioValueModifier,
  useRestPortfolioValueModifiers,
} from 'uniswap/src/features/dataApi/balances/useRestPortfolioValueModifier'
import { renderHookWithProviders } from 'uniswap/src/test/render'

const {
  mockUseEnabledChains,
  mockUseCurrencyIdToVisibility,
  mockUseHideSmallBalancesSetting,
  mockUseHideSpamTokensSetting,
} = vi.hoisted(() => ({
  mockUseEnabledChains: vi.fn(),
  mockUseCurrencyIdToVisibility: vi.fn(),
  mockUseHideSmallBalancesSetting: vi.fn(),
  mockUseHideSpamTokensSetting: vi.fn(),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: mockUseEnabledChains,
}))

vi.mock('uniswap/src/features/settings/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/settings/hooks')>()),
  useHideSmallBalancesSetting: mockUseHideSmallBalancesSetting,
  useHideSpamTokensSetting: mockUseHideSpamTokensSetting,
}))

vi.mock('uniswap/src/features/transactions/selectors', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/transactions/selectors')>()),
  useCurrencyIdToVisibility: mockUseCurrencyIdToVisibility,
}))

const EVM_ADDRESS_A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const EVM_ADDRESS_B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
const VISIBLE_TOKEN_ID = '1-0x1111111111111111111111111111111111111111'
const HIDDEN_TOKEN_ID = `${UniverseChainId.Optimism}-0x2222222222222222222222222222222222222222`

describe(useRestPortfolioValueModifiers, () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseEnabledChains.mockReturnValue({ chains: [UniverseChainId.Mainnet], isTestnetModeEnabled: false })
    mockUseCurrencyIdToVisibility.mockReturnValue({})
    mockUseHideSmallBalancesSetting.mockReturnValue(false)
    mockUseHideSpamTokensSetting.mockReturnValue(false)
  })

  it('returns undefined when no addresses are provided', () => {
    const { result } = renderHookWithProviders(() => useRestPortfolioValueModifiers())
    expect(result.current).toBeUndefined()
  })

  it('returns undefined for an empty address array', () => {
    const { result } = renderHookWithProviders(() => useRestPortfolioValueModifiers([]))
    expect(result.current).toBeUndefined()
  })

  it('returns one modifier per address with default include flags and no overrides', () => {
    const { result } = renderHookWithProviders(() => useRestPortfolioValueModifiers([EVM_ADDRESS_A, EVM_ADDRESS_B]))

    expect(result.current).toEqual([
      {
        address: EVM_ADDRESS_A,
        includeOverrides: [],
        excludeOverrides: [],
        includeSmallBalances: true,
        includeSpamTokens: true,
      },
      {
        address: EVM_ADDRESS_B,
        includeOverrides: [],
        excludeOverrides: [],
        includeSmallBalances: true,
        includeSpamTokens: true,
      },
    ])
  })

  it('splits visibility map into includeOverrides (visible) and excludeOverrides (hidden) on every address', () => {
    mockUseCurrencyIdToVisibility.mockReturnValue({
      [VISIBLE_TOKEN_ID]: { isVisible: true },
      [HIDDEN_TOKEN_ID]: { isVisible: false },
    })

    const { result } = renderHookWithProviders(() => useRestPortfolioValueModifiers([EVM_ADDRESS_A, EVM_ADDRESS_B]))

    const expectedIncludeOverrides = [
      { chainId: UniverseChainId.Mainnet, address: '0x1111111111111111111111111111111111111111' },
    ]
    const expectedExcludeOverrides = [
      { chainId: UniverseChainId.Optimism, address: '0x2222222222222222222222222222222222222222' },
    ]

    expect(result.current?.[0]).toMatchObject({
      address: EVM_ADDRESS_A,
      includeOverrides: expectedIncludeOverrides,
      excludeOverrides: expectedExcludeOverrides,
    })
    expect(result.current?.[1]).toMatchObject({
      address: EVM_ADDRESS_B,
      includeOverrides: expectedIncludeOverrides,
      excludeOverrides: expectedExcludeOverrides,
    })
  })

  it('flips includeSmallBalances to false when hideSmallBalances setting is on', () => {
    mockUseHideSmallBalancesSetting.mockReturnValue(true)

    const { result } = renderHookWithProviders(() => useRestPortfolioValueModifiers([EVM_ADDRESS_A]))

    expect(result.current?.[0]).toMatchObject({ includeSmallBalances: false })
  })

  it('flips includeSpamTokens to false when hideSpamTokens setting is on', () => {
    mockUseHideSpamTokensSetting.mockReturnValue(true)

    const { result } = renderHookWithProviders(() => useRestPortfolioValueModifiers([EVM_ADDRESS_A]))

    expect(result.current?.[0]).toMatchObject({ includeSpamTokens: false })
  })

  it('forces includeSpamTokens to true in testnet mode even when hideSpamTokens is on', () => {
    mockUseEnabledChains.mockReturnValue({ chains: [UniverseChainId.Mainnet], isTestnetModeEnabled: true })
    mockUseHideSpamTokensSetting.mockReturnValue(true)

    const { result } = renderHookWithProviders(() => useRestPortfolioValueModifiers([EVM_ADDRESS_A]))

    expect(result.current?.[0]).toMatchObject({ includeSpamTokens: true })
  })
})

describe(useRestPortfolioValueModifier, () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseEnabledChains.mockReturnValue({ chains: [UniverseChainId.Mainnet], isTestnetModeEnabled: false })
    mockUseCurrencyIdToVisibility.mockReturnValue({})
    mockUseHideSmallBalancesSetting.mockReturnValue(false)
    mockUseHideSpamTokensSetting.mockReturnValue(false)
  })

  it('returns undefined when no address is provided', () => {
    const { result } = renderHookWithProviders(() => useRestPortfolioValueModifier())
    expect(result.current).toBeUndefined()
  })

  it('returns a single modifier object (not an array) for the given address', () => {
    const { result } = renderHookWithProviders(() => useRestPortfolioValueModifier(EVM_ADDRESS_A))

    expect(result.current).toEqual({
      address: EVM_ADDRESS_A,
      includeOverrides: [],
      excludeOverrides: [],
      includeSmallBalances: true,
      includeSpamTokens: true,
    })
  })

  it('forwards visibility overrides and settings to the resulting modifier', () => {
    mockUseCurrencyIdToVisibility.mockReturnValue({
      [HIDDEN_TOKEN_ID]: { isVisible: false },
    })
    mockUseHideSmallBalancesSetting.mockReturnValue(true)

    const { result } = renderHookWithProviders(() => useRestPortfolioValueModifier(EVM_ADDRESS_A))

    expect(result.current).toMatchObject({
      address: EVM_ADDRESS_A,
      includeOverrides: [],
      excludeOverrides: [{ chainId: UniverseChainId.Optimism, address: '0x2222222222222222222222222222222222222222' }],
      includeSmallBalances: false,
      includeSpamTokens: true,
    })
  })
})
