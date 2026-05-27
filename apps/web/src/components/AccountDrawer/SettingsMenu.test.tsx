import { FeatureFlags } from '@universe/gating'
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

const mockedFeatureFlag = vi.hoisted(() => vi.fn<(flag: unknown) => boolean>(() => false))
vi.mock('@universe/gating', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@universe/gating')>()
  return { ...mod, useFeatureFlag: mockedFeatureFlag }
})

const defaultProps = {
  onClose: noop,
  openLanguageSettings: noop,
  openLocalCurrencySettings: noop,
  openPasskeySettings: noop,
  openRecoveryPhraseSettings: noop,
  openPortfolioBalanceSettings: noop,
  openStorageSettings: noop,
  openNetworkCostSettings: noop,
}

describe('SettingsMenu', () => {
  beforeEach(() => {
    mockedFeatureFlag.mockImplementation(() => false)
  })

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

  describe('Network costs row', () => {
    it('shows the row when GasFeeOverrides flag is on AND user has an embedded wallet', () => {
      mocked(useIsEmbeddedWallet).mockReturnValue(true)
      mockedFeatureFlag.mockImplementation((flag) => flag === FeatureFlags.GasFeeOverrides)
      const { queryByText } = render(<SettingsMenu {...defaultProps} />)
      expect(queryByText('Network costs')).toBeTruthy()
    })

    it('hides the row when GasFeeOverrides flag is on but user does NOT have an embedded wallet', () => {
      mocked(useIsEmbeddedWallet).mockReturnValue(false)
      mockedFeatureFlag.mockImplementation((flag) => flag === FeatureFlags.GasFeeOverrides)
      const { queryByText } = render(<SettingsMenu {...defaultProps} />)
      expect(queryByText('Network costs')).toBeNull()
    })

    it('hides the row when GasFeeOverrides flag is off (regardless of wallet type)', () => {
      mocked(useIsEmbeddedWallet).mockReturnValue(true)
      mockedFeatureFlag.mockImplementation(() => false)
      const { queryByText } = render(<SettingsMenu {...defaultProps} />)
      expect(queryByText('Network costs')).toBeNull()
    })
  })
})
