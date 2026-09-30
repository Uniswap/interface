import { fireEvent, screen, waitFor } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import type { ReactNode } from 'react'
import { setExploreEarnCoachmarkDismissed } from 'uniswap/src/features/behaviorHistory/slice'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { EarnEventName } from 'uniswap/src/features/telemetry/constants/features'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { EarnVaultsSection } from '~/pages/Explore/EarnVaultsSection'
import store from '~/state'
import { render } from '~/test-utils/render'

vi.mock('ui/src', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ui/src')>()
  return {
    ...actual,
    Coachmark: ({
      children,
      onDismiss,
      open,
      testID,
      text,
      title,
      width,
    }: {
      children: ReactNode
      onDismiss: () => void
      open: boolean
      testID?: string
      text: string
      title?: string
      width?: number
    }): JSX.Element => (
      <>
        {children}
        {open && (
          <button data-testid={testID} data-width={width} onClick={onDismiss}>
            {title && <span>{title}</span>}
            <span>{text}</span>
          </button>
        )}
      </>
    ),
  }
})

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
const mockScrollIntoView = vi.fn()

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
    Element.prototype.scrollIntoView = mockScrollIntoView
    vi.clearAllMocks()
    window.history.replaceState(null, '', '/')
    store.dispatch(setExploreEarnCoachmarkDismissed(false))
  })

  afterEach(() => {
    vi.restoreAllMocks()
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

  it('shows the Earn coachmark copy and dismisses it on click', async () => {
    mockUseEarnVaults.mockReturnValue(createUseEarnVaultsResult())
    window.history.replaceState(null, '', '/explore?section=earn')

    render(<EarnVaultsSection />)

    expect(screen.getByText('Start earning')).toBeInTheDocument()
    expect(screen.getByText('Select an Earn vault to get started')).toBeInTheDocument()
    expect(screen.getByTestId(TestID.ExploreEarnCoachmark)).toHaveAttribute('data-width', '215')
    await waitFor(() => {
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' })
    })

    fireEvent.click(screen.getByTestId(TestID.ExploreEarnCoachmark))

    expect(store.getState().uniswapBehaviorHistory.hasDismissedExploreEarnCoachmark).toBe(true)
  })
})
