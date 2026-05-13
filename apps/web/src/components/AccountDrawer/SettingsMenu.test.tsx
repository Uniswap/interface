import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { SettingsMenu } from '~/components/AccountDrawer/SettingsMenu'
import { useAccount } from '~/hooks/useAccount'
import { mocked } from '~/test-utils/mocked'
import { render } from '~/test-utils/render'

const noop = () => {}

vi.mock('~/hooks/useAccount')
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
    mocked(useAccount).mockReturnValue({ connector: { id: 'injected' } } as any)
    const { container } = render(<SettingsMenu {...defaultProps} />)
    expect(container).toMatchSnapshot()
  })

  it('renders for embedded wallet user (Login Methods + Log out visible)', () => {
    mocked(useAccount).mockReturnValue({
      connector: { id: CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID },
    } as any)
    const { container } = render(<SettingsMenu {...defaultProps} />)
    expect(container).toMatchSnapshot()
  })
})
