import { useHomeScreenPortfolioHeader } from 'src/screens/HomeScreen/portfolio/header/useHomeScreenPortfolioHeader'
import { render, screen } from 'src/test/test-utils'
import { AccountType } from 'uniswap/src/features/accounts/types'

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
  const { Flex } = await vi.importActual<typeof import('ui/src')>('ui/src')
  return {
    MobileNotificationServiceManager: ({ onCardsChange }: { onCardsChange: (hasCards: boolean) => void }) => {
      useEffect(() => onCardsChange(true), [onCardsChange])
      return <Flex testID={NOTIF_TEST_ID} />
    },
  }
})

vi.mock('wallet/src/features/earn/HomeScreenEarningSection', async () => {
  const { Text } = await vi.importActual<typeof import('ui/src')>('ui/src')
  return {
    HomeScreenEarningSection: ({ mb, isRevealReady }: { mb?: string; isRevealReady?: boolean }) => (
      <Text testID={EARNING_TEST_ID}>{`${String(mb)}|${String(isRevealReady)}`}</Text>
    ),
  }
})

function TestHost(): JSX.Element {
  return useHomeScreenPortfolioHeader().header
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
    expect(earning.textContent).toBe('$spacing8|true')
  })
})
