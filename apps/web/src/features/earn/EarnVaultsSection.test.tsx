import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { EarnEventName } from 'uniswap/src/features/telemetry/constants/features'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { EarnVaultsSection } from '~/features/earn/EarnVaultsSection'
import { render } from '~/test-utils/render'

vi.mock('uniswap/src/features/earn/hooks/useEarnVaults', () => ({
  useEarnVaults: vi.fn(),
}))

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

vi.mock('uniswap/src/features/earn/EarnVaultChip', () => ({
  EARN_VAULT_CHIP_FRAME_PROPS: {},
  EARN_VAULT_CHIP_MAX_WIDTH: 320,
  EarnVaultChip: (): JSX.Element => <div />,
}))

vi.mock('~/components/Tokens/loading', () => ({
  LoadingBubble: (): JSX.Element => <div />,
}))

vi.mock('~/features/earn/EarnVaultModal', () => ({
  EarnVaultModal: (): null => null,
}))

vi.mock('~/features/earn/hooks/useEarnVaultConnectFlow', () => ({
  useEarnVaultConnectFlow: (): { onConnectWallet: () => void } => ({
    onConnectWallet: vi.fn(),
  }),
}))

vi.mock('~/features/earn/hooks/useEarnVaultModalState', () => ({
  useEarnVaultModalState: (): {
    closeModal: () => void
    openModal: () => void
    selectedVaultState: null
  } => ({ closeModal: vi.fn(), openModal: vi.fn(), selectedVaultState: null }),
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

const mockUseEarnVaults = vi.mocked(useEarnVaults)
const mockSendAnalyticsEvent = vi.mocked(sendAnalyticsEvent)

function createUseEarnVaultsResult(
  overrides: Partial<ReturnType<typeof useEarnVaults>> = {},
): ReturnType<typeof useEarnVaults> {
  return {
    hasLoadedPositions: false,
    isError: false,
    isLoadingPositions: false,
    isLoadingVaults: false,
    positionsByVaultId: new Map(),
    refetch: vi.fn(),
    totalDepositedUsd: 0,
    vaults: [],
    vaultsSortedByPosition: [],
    ...overrides,
  }
}

describe(EarnVaultsSection, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs the Explore surface only after vault content is available', () => {
    mockUseEarnVaults.mockReturnValue(createUseEarnVaultsResult({ isLoadingVaults: true }))

    const { rerender } = render(<EarnVaultsSection />)

    expect(mockSendAnalyticsEvent).not.toHaveBeenCalled()

    mockUseEarnVaults.mockReturnValue(createUseEarnVaultsResult())
    rerender(<EarnVaultsSection />)

    expect(mockSendAnalyticsEvent).not.toHaveBeenCalled()

    mockUseEarnVaults.mockReturnValue(createUseEarnVaultsResult({ vaults: [VAULT] }))
    rerender(<EarnVaultsSection />)

    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(1)
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(EarnEventName.EarnSurfaceViewed, {
      entry_point: 'explore_chip',
      surface: 'web',
    })
  })
})
