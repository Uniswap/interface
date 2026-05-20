import { SettingsMenu } from '~/components/AccountDrawer/SettingsMenu'
import { useIsEmbeddedWallet } from '~/hooks/useIsEmbeddedWallet'
import { mocked } from '~/test-utils/mocked'
import { render } from '~/test-utils/render'

const noop = () => {}

vi.mock('~/hooks/useIsEmbeddedWallet')
vi.mock('~/components/AccountDrawer/DisconnectButton', () => ({
  useOnDisconnect: vi.fn().mockReturnValue(vi.fn()),
}))
vi.mock('~/components/AccountDrawer/AnalyticsToggle', () => ({
  AnalyticsToggle: () => null,
}))
vi.mock('~/components/AccountDrawer/SlideOutMenu', () => ({
  SlideOutMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const defaultProps = {
  onClose: noop,
  openLanguageSettings: noop,
  openLocalCurrencySettings: noop,
  openPasskeySettings: noop,
  openRecoveryPhraseSettings: noop,
  openPortfolioBalanceSettings: noop,
  openStorageSettings: noop,
}

describe('SettingsMenu', () => {
  it('renders for standard wallet user', () => {
    mocked(useIsEmbeddedWallet).mockReturnValue(false)
    const { container } = render(<SettingsMenu {...defaultProps} />)
    expect(container).toMatchSnapshot()
  })

  it('renders for embedded wallet user (Login Methods + Log out visible)', () => {
    mocked(useIsEmbeddedWallet).mockReturnValue(true)
    const { container } = render(<SettingsMenu {...defaultProps} />)
    expect(container).toMatchSnapshot()
  })
})
