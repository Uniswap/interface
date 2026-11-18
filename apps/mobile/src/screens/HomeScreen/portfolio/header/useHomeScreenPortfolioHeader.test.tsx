import { useHomeScreenPortfolioHeader } from 'src/screens/HomeScreen/portfolio/header/useHomeScreenPortfolioHeader'
import { act, render, screen } from 'src/test/test-utils'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useOnboardingChecklistStore } from 'uniswap/src/features/onboarding/checklist/onboardingChecklistStore'

const NOTIF_TEST_ID = 'notif-marker'
const EARNING_TEST_ID = 'earning-marker'

vi.mock('@universe/gating', async () => ({
  ...(await vi.importActual('@universe/gating')),
  useFeatureFlag: (): boolean => true,
}))

vi.mock('@react-navigation/native', async () => ({
  ...(await vi.importActual('@react-navigation/native')),
  useIsFocused: (): boolean => true,
}))

vi.mock('src/app/navigation/rootNavigation', () => ({ navigate: vi.fn() }))
vi.mock('src/components/accounts/AccountHeader', () => ({ AccountHeader: (): null => null }))
vi.mock('src/components/home/PortfolioChart/PortfolioOverview', () => ({ PortfolioOverview: (): null => null }))
vi.mock('src/components/home/introCards/OnboardingIntroCardStack', () => ({
  OnboardingIntroCardStack: (): null => null,
}))
vi.mock('src/components/home/onboardingChecklist/OnboardingChecklist', () => ({
  OnboardingChecklist: (): null => null,
}))
vi.mock('src/screens/HomeScreen/HomeScreenQuickActions', () => ({ HomeScreenQuickActions: (): null => null }))
vi.mock('src/screens/HomeScreen/useHomeScreenState', () => ({
  useHomeScreenState: () => ({ showEmptyWalletState: false, isTabsDataLoaded: true }),
}))
vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', async () => ({
  ...(await vi.importActual('uniswap/src/features/chains/hooks/useEnabledChains')),
  useEnabledChains: () => ({ chains: [] }),
}))
vi.mock('uniswap/src/features/dataApi/balances/balancesRest', async () => ({
  ...(await vi.importActual('uniswap/src/features/dataApi/balances/balancesRest')),
  usePortfolioTotalValue: () => ({ error: undefined, dataUpdatedAt: 0 }),
}))
vi.mock('wallet/src/features/unitags/hooks/useCanActiveAddressClaimUnitag', () => ({
  useCanActiveAddressClaimUnitag: () => ({ canClaimUnitag: false, isLoading: false }),
}))
vi.mock('wallet/src/features/wallet/hooks', async () => ({
  ...(await vi.importActual('wallet/src/features/wallet/hooks')),
  useActiveAccountWithThrow: () => ({
    type: AccountType.SignerMnemonic,
    address: '0x0000000000000000000000000000000000000001',
  }),
}))

vi.mock('src/notification-service/MobileNotificationServiceManager', async () => {
  const { useEffect } = await vi.importActual<typeof import('react')>('react')
  const { Text } = await vi.importActual<typeof import('@universe/mycelium')>('@universe/mycelium')
  return {
    MobileNotificationServiceManager: ({
      isLoading,
      onCardsChange,
      suppressIntroCards,
    }: {
      isLoading?: boolean
      onCardsChange: (hasCards: boolean) => void
      suppressIntroCards?: boolean
    }) => {
      useEffect(() => onCardsChange(!suppressIntroCards), [onCardsChange, suppressIntroCards])
      return <Text testID={NOTIF_TEST_ID}>{isLoading ? 'loading' : 'loaded'}</Text>
    },
  }
})

vi.mock('wallet/src/features/earn/HomeScreenEarningSection', async () => {
  const { Text } = await vi.importActual<typeof import('@universe/mycelium')>('@universe/mycelium')
  return {
    HomeScreenEarningSection: ({
      mb,
      isRevealReady,
      earnCardExpansionRequestId,
      onEarnCardExpansionRequestHandled,
    }: {
      mb?: string
      isRevealReady?: boolean
      earnCardExpansionRequestId?: number
      onEarnCardExpansionRequestHandled?: (requestId: number) => void
    }) => (
      <Text testID={EARNING_TEST_ID}>
        {`${String(mb)}|${String(isRevealReady)}|${String(earnCardExpansionRequestId)}|${String(Boolean(onEarnCardExpansionRequestHandled))}`}
      </Text>
    ),
  }
})

function TestHost({
  earnCardExpansionRequestId,
  onEarnCardExpansionRequestHandled,
}: {
  earnCardExpansionRequestId?: number
  onEarnCardExpansionRequestHandled?: (requestId: number) => void
}): JSX.Element {
  return useHomeScreenPortfolioHeader({ earnCardExpansionRequestId, onEarnCardExpansionRequestHandled }).header
}

describe('useHomeScreenPortfolioHeader', () => {
  it('renders the notification card above Earning and applies the intro-card bottom margin', () => {
    render(<TestHost />)

    const notif = screen.getByTestId(NOTIF_TEST_ID) as unknown as HTMLElement
    const earning = screen.getByTestId(EARNING_TEST_ID) as unknown as HTMLElement

    // Earning must follow the notification card in the header layout.
    expect(notif.compareDocumentPosition(earning)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    // With intro cards present, Earning receives the compact bottom margin instead of its -8 default,
    // and the reveal is marked ready (focused, tabs loaded, unitag eligibility settled).
    expect(earning.textContent).toBe('$spacing8|true|undefined|false')
  })

  it('passes the Earn expansion request and consumption callback to the earning section', () => {
    render(<TestHost earnCardExpansionRequestId={42} onEarnCardExpansionRequestHandled={vi.fn()} />)

    expect((screen.getByTestId(EARNING_TEST_ID) as unknown as HTMLElement).textContent).toBe('$spacing8|true|42|true')
  })

  it('holds back intro cards and drops their margin while the onboarding checklist is up', () => {
    render(<TestHost />)
    act(() => useOnboardingChecklistStore.getState().setIsVisible(true))

    expect(screen.getByTestId(NOTIF_TEST_ID)).toBeTruthy()
    expect((screen.getByTestId(EARNING_TEST_ID) as unknown as HTMLElement).textContent).toBe(
      'undefined|true|undefined|false',
    )

    act(() => useOnboardingChecklistStore.getState().setIsVisible(false))
  })

  it('keeps the intro cards loading until the checklist knows whether it will show', () => {
    render(<TestHost />)
    expect((screen.getByTestId(NOTIF_TEST_ID) as unknown as HTMLElement).textContent).toBe('loaded')

    act(() => useOnboardingChecklistStore.getState().setIsLoading(true))
    expect((screen.getByTestId(NOTIF_TEST_ID) as unknown as HTMLElement).textContent).toBe('loading')

    act(() => useOnboardingChecklistStore.getState().setIsLoading(false))
    expect((screen.getByTestId(NOTIF_TEST_ID) as unknown as HTMLElement).textContent).toBe('loaded')
  })
})
