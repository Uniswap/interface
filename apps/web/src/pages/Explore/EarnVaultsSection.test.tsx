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
  EarnVaultChip: ({
    borderRadius,
    layout = 'horizontal',
    vault,
    width,
  }: {
    borderRadius?: string
    layout?: string
    vault: EarnVaultInfo
    width?: number
  }): JSX.Element => (
    <div data-testid={`chip-${vault.id}`} data-layout={layout} data-radius={borderRadius} data-width={width} />
  ),
}))

const mockUseCarouselLayout = vi.hoisted(() => vi.fn())
vi.mock('~/components/TokenCardCarousel/useCarouselLayout', () => ({
  useCarouselLayout: mockUseCarouselLayout,
}))

const mockUseMedia = vi.hoisted(() => vi.fn())
vi.mock('@universe/mycelium', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/mycelium')>()
  return { ...actual, useMedia: mockUseMedia }
})

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
    mockUseMedia.mockReturnValue({ md: false })
    mockUseCarouselLayout.mockReturnValue({
      containerWidth: 1120,
      cardWidth: 271,
      fadeWidth: 96,
      showArrowButtons: true,
    })
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

  // Expected values are literals on purpose: they pin the intended widths and radius, not whatever the code passes.
  it('sizes chips like the Trending token cards above the md breakpoint', () => {
    mockUseEarnVaults.mockReturnValue(createUseEarnVaultsResult({ vaults: [VAULT] }))

    render(<EarnVaultsSection />)

    const chip = screen.getByTestId('chip-vault-a')
    expect(chip).toHaveAttribute('data-layout', 'horizontal')
    expect(chip).toHaveAttribute('data-width', '271')
    expect(chip).toHaveAttribute('data-radius', '$rounded16')
  })

  it.each([
    // Visible width is the container plus the 16px right gutter: (374 - 2 * 12) / 2.3 = 152.2 at a 390px viewport,
    // (344 - 24) / 2.3 = 139.1 at 360px, (624 - 24) / 2.3 = 260.9 at 640px.
    { containerWidth: 358, expectedWidth: '152' },
    { containerWidth: 328, expectedWidth: '139' },
    { containerWidth: 608, expectedWidth: '260' },
    { containerWidth: 200, expectedWidth: '120' },
    { containerWidth: 0, expectedWidth: '120' },
  ])(
    'shows two stacked chips plus a teaser in the md carousel (container $containerWidth)',
    ({ containerWidth, expectedWidth }) => {
      mockUseMedia.mockReturnValue({ md: true })
      mockUseCarouselLayout.mockReturnValue({ containerWidth, cardWidth: 280, fadeWidth: 24, showArrowButtons: false })
      mockUseEarnVaults.mockReturnValue(createUseEarnVaultsResult({ vaults: [VAULT] }))

      render(<EarnVaultsSection />)

      const chip = screen.getByTestId('chip-vault-a')
      expect(chip).toHaveAttribute('data-layout', 'vertical')
      expect(chip).toHaveAttribute('data-width', expectedWidth)
      expect(chip).toHaveAttribute('data-radius', '$rounded16')
    },
  )

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
