import { act, fireEvent } from '@testing-library/react-native'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures/events'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { initialBehaviorHistoryState } from 'wallet/src/features/behaviorHistory/slice'
import { HomeScreenEarningSection } from 'wallet/src/features/earn/HomeScreenEarningSection'
import { renderWithProviders } from 'wallet/src/test/render'

const EVM_ADDRESS = '0x0000000000000000000000000000000000000001'

vi.mock('uniswap/src/features/earn/hooks/useEarnVaults', () => ({
  useEarnVaults: vi.fn(),
}))

vi.mock('@universe/gating', async () => ({
  ...(await vi.importActual('@universe/gating')),
  useFeatureFlag: (): boolean => true,
}))

const mockUsePortfolioTotalValue = vi.fn()
vi.mock('uniswap/src/features/dataApi/balances/balancesRest', () => ({
  usePortfolioTotalValue: (): unknown => mockUsePortfolioTotalValue(),
}))

const VAULT: EarnVaultInfo = {
  id: 'vault-a',
  currencyId: '1-0xa',
  displayCurrencyId: '1-0xa',
  vaultAddress: '0xa',
  chainId: UniverseChainId.Mainnet,
  apyPercent: 4,
  exposureCurrencyIds: [],
  exposures: [],
  totalDepositsUsd: 0,
  liquidityUsd: 0,
  curator: { name: 'Gauntlet' },
}

const POSITION: EarnPositionInfo = {
  vaultId: VAULT.id,
  depositedUsd: 100,
  depositedRaw: '100000000',
  apyPercent: VAULT.apyPercent,
  sharesRaw: '100000000',
}

const mockUseEarnVaults = vi.mocked(useEarnVaults)
const mockRefetch = vi.fn()

function mockEarnVaultsResult({
  vaults = [],
  positionsByVaultId = new Map<string, EarnPositionInfo>(),
  isLoadingVaults = false,
  isLoadingPositions = false,
  isError = false,
}: {
  vaults?: EarnVaultInfo[]
  positionsByVaultId?: Map<string, EarnPositionInfo>
  isLoadingVaults?: boolean
  isLoadingPositions?: boolean
  isError?: boolean
} = {}): void {
  mockUseEarnVaults.mockReturnValue({
    hasLoadedPositions: !isLoadingPositions,
    isLoadingPositions,
    isLoadingVaults,
    isError,
    refetch: mockRefetch,
    positionsByVaultId,
    totalDepositedUsd: 0,
    vaults,
    vaultsSortedByPosition: vaults,
  })
}

describe(HomeScreenEarningSection, () => {
  beforeEach(() => {
    mockUseEarnVaults.mockReset()
    mockRefetch.mockClear()
    mockUsePortfolioTotalValue.mockReset()
    mockUsePortfolioTotalValue.mockReturnValue({ data: undefined })
  })

  it('renders the error card with a working retry when the load fails', () => {
    mockEarnVaultsResult({ isError: true })

    const { getByTestId } = renderWithProviders(<HomeScreenEarningSection evmAddress={EVM_ADDRESS} />)

    expect(getByTestId(TestID.HomeEarningError)).toBeTruthy()

    fireEvent.press(getByTestId(TestID.HomeEarningErrorRetry), ON_PRESS_EVENT_PAYLOAD)
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('renders nothing when there are no positions and no error', () => {
    mockEarnVaultsResult({ vaults: [VAULT] })

    const { queryByTestId } = renderWithProviders(<HomeScreenEarningSection evmAddress={EVM_ADDRESS} />)

    expect(queryByTestId(TestID.HomeEarningError)).toBeNull()
    expect(queryByTestId(TestID.HomeEarningSkeleton)).toBeNull()
  })

  it('renders the skeleton while positions load once the reveal has been seen', () => {
    mockEarnVaultsResult({ vaults: [VAULT], isLoadingPositions: true })

    const { getByTestId } = renderWithProviders(<HomeScreenEarningSection evmAddress={EVM_ADDRESS} />, {
      preloadedState: {
        behaviorHistory: { ...initialBehaviorHistoryState, hasSeenUnfundedEarnCardReveal: true },
      },
    })

    expect(getByTestId(TestID.HomeEarningSkeleton)).toBeTruthy()
  })

  it('hides the skeleton while loading when the reveal has not been seen', () => {
    mockEarnVaultsResult({ vaults: [VAULT], isLoadingPositions: true })

    const { queryByTestId } = renderWithProviders(<HomeScreenEarningSection evmAddress={EVM_ADDRESS} />)

    expect(queryByTestId(TestID.HomeEarningSkeleton)).toBeNull()
  })

  it('renders the earning card when the wallet has a position', () => {
    mockEarnVaultsResult({ vaults: [VAULT], positionsByVaultId: new Map([[VAULT.id, POSITION]]) })

    const { getByText } = renderWithProviders(<HomeScreenEarningSection evmAddress={EVM_ADDRESS} />)

    expect(getByText('home.earning.title')).toBeTruthy()
  })

  it('marks the reveal as seen when the funded earning card renders', () => {
    mockEarnVaultsResult({ vaults: [VAULT], positionsByVaultId: new Map([[VAULT.id, POSITION]]) })

    const { store } = renderWithProviders(<HomeScreenEarningSection evmAddress={EVM_ADDRESS} />)

    expect(store.getState().behaviorHistory.hasSeenUnfundedEarnCardReveal).toBe(true)
  })

  it('shows discovery rows for vaults without positions when expanded', () => {
    const unfundedVault: EarnVaultInfo = {
      ...VAULT,
      id: 'vault-b',
      currencyId: '1-0xb',
      displayCurrencyId: '1-0xb',
      vaultAddress: '0xb',
      apyPercent: 6,
    }
    mockEarnVaultsResult({
      vaults: [VAULT, unfundedVault],
      positionsByVaultId: new Map([[VAULT.id, POSITION]]),
    })

    const { getByTestId, queryByTestId } = renderWithProviders(<HomeScreenEarningSection evmAddress={EVM_ADDRESS} />)

    expect(queryByTestId(`${TestID.HomeEarnDiscoveryVaultPrefix}${unfundedVault.id}`)).toBeNull()

    fireEvent.press(getByTestId(TestID.HomeEarningToggle), ON_PRESS_EVENT_PAYLOAD)

    expect(getByTestId(`${TestID.HomeEarnDiscoveryVaultPrefix}${unfundedVault.id}`)).toBeTruthy()
    expect(queryByTestId(`${TestID.HomeEarnDiscoveryVaultPrefix}${VAULT.id}`)).toBeNull()
  })

  it('renders the unfunded card when the wallet has a balance but no positions', () => {
    mockUsePortfolioTotalValue.mockReturnValue({ data: { balanceUSD: 100 } })
    mockEarnVaultsResult({ vaults: [VAULT] })

    const { getByTestId } = renderWithProviders(<HomeScreenEarningSection evmAddress={EVM_ADDRESS} />)

    expect(getByTestId(TestID.HomeEarnUnfundedCard)).toBeTruthy()

    fireEvent.press(getByTestId(TestID.HomeEarnUnfundedToggle), ON_PRESS_EVENT_PAYLOAD)
    expect(getByTestId(`${TestID.HomeEarnDiscoveryVaultPrefix}${VAULT.id}`)).toBeTruthy()
  })

  it('does not render the unfunded card for a zero-balance wallet', () => {
    mockUsePortfolioTotalValue.mockReturnValue({ data: { balanceUSD: 0 } })
    mockEarnVaultsResult({ vaults: [VAULT] })

    const { queryByTestId } = renderWithProviders(<HomeScreenEarningSection evmAddress={EVM_ADDRESS} />)

    expect(queryByTestId(TestID.HomeEarnUnfundedCard)).toBeNull()
  })

  it('does not render the unfunded card while the balance is still unknown', () => {
    mockUsePortfolioTotalValue.mockReturnValue({ data: undefined })
    mockEarnVaultsResult({ vaults: [VAULT] })

    const { queryByTestId } = renderWithProviders(<HomeScreenEarningSection evmAddress={EVM_ADDRESS} />)

    expect(queryByTestId(TestID.HomeEarnUnfundedCard)).toBeNull()
  })

  it('plays the unfunded card reveal once and persists the flag', () => {
    vi.useFakeTimers()
    try {
      mockUsePortfolioTotalValue.mockReturnValue({ data: { balanceUSD: 100 } })
      mockEarnVaultsResult({ vaults: [VAULT] })

      const { store, getByTestId } = renderWithProviders(<HomeScreenEarningSection evmAddress={EVM_ADDRESS} />)

      expect(getByTestId(TestID.HomeEarnUnfundedCard)).toBeTruthy()
      expect(store.getState().behaviorHistory.hasSeenUnfundedEarnCardReveal).toBeFalsy()

      act(() => {
        vi.advanceTimersByTime(5_000)
      })

      expect(store.getState().behaviorHistory.hasSeenUnfundedEarnCardReveal).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('holds the reveal and the flag while isRevealReady is false, then plays once ready', () => {
    vi.useFakeTimers()
    try {
      mockUsePortfolioTotalValue.mockReturnValue({ data: { balanceUSD: 100 } })
      mockEarnVaultsResult({ vaults: [VAULT] })

      const { store, getByTestId, rerender } = renderWithProviders(
        <HomeScreenEarningSection evmAddress={EVM_ADDRESS} isRevealReady={false} />,
      )

      expect(getByTestId(TestID.HomeEarnUnfundedCard)).toBeTruthy()

      act(() => {
        vi.advanceTimersByTime(5_000)
      })
      expect(store.getState().behaviorHistory.hasSeenUnfundedEarnCardReveal).toBeFalsy()

      rerender(<HomeScreenEarningSection evmAddress={EVM_ADDRESS} isRevealReady />)
      act(() => {
        vi.advanceTimersByTime(5_000)
      })
      expect(store.getState().behaviorHistory.hasSeenUnfundedEarnCardReveal).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not cancel a started reveal when readiness is lost mid-animation', () => {
    vi.useFakeTimers()
    try {
      mockUsePortfolioTotalValue.mockReturnValue({ data: { balanceUSD: 100 } })
      mockEarnVaultsResult({ vaults: [VAULT] })

      const { store, rerender } = renderWithProviders(
        <HomeScreenEarningSection evmAddress={EVM_ADDRESS} isRevealReady />,
      )

      act(() => {
        vi.advanceTimersByTime(500)
      })
      rerender(<HomeScreenEarningSection evmAddress={EVM_ADDRESS} isRevealReady={false} />)
      act(() => {
        vi.advanceTimersByTime(5_000)
      })
      expect(store.getState().behaviorHistory.hasSeenUnfundedEarnCardReveal).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not replay the reveal when it has already been seen', () => {
    vi.useFakeTimers()
    try {
      mockUsePortfolioTotalValue.mockReturnValue({ data: { balanceUSD: 100 } })
      mockEarnVaultsResult({ vaults: [VAULT] })

      const { store, getByTestId } = renderWithProviders(<HomeScreenEarningSection evmAddress={EVM_ADDRESS} />, {
        preloadedState: {
          behaviorHistory: { ...initialBehaviorHistoryState, hasSeenUnfundedEarnCardReveal: true },
        },
      })

      expect(getByTestId(TestID.HomeEarnUnfundedCard)).toBeTruthy()

      const dispatchSpy = vi.spyOn(store, 'dispatch')
      act(() => {
        vi.advanceTimersByTime(5_000)
      })

      expect(dispatchSpy).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })
})
