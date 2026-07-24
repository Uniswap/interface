import { TokenDetailsEarnSection } from 'uniswap/src/components/tokenDetails/TokenDetailsEarnSection'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { fireEvent, render, screen } from 'uniswap/src/test/test-utils'

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: vi.fn(() => undefined),
}))

const position: EarnPositionInfo = {
  vaultId: 'vault-id',
  depositedUsd: 2345.67,
  depositedRaw: '2345670000',
  sharesRaw: '2345670000',
  apyPercent: 5.23,
  lifetimePnlUsd: 0.000016,
}

const vault = {
  id: 'vault-id',
  displayCurrencyId: '1-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
} as EarnVaultInfo

describe(TokenDetailsEarnSection, (): void => {
  it('renders the mobile position treatment and opens vault details from the info trigger', (): void => {
    const onPositionPress = vi.fn()

    render(
      <TokenDetailsEarnSection
        mobileLayout
        earnPosition={position}
        earnVault={vault}
        onDepositPress={vi.fn()}
        onPositionPress={onPositionPress}
        onWithdrawPress={vi.fn()}
      />,
    )

    expect(screen.getByText('home.earning.title')).toBeDefined()
    expect(screen.getByText('explore.earn.vault.rewardRate')).toBeDefined()
    expect(screen.getByText('pool.positions.summary.totalRewards')).toBeDefined()
    expect(screen.getByText('$2,345.67')).toBeDefined()
    expect(screen.getByText('explore.earn.vault.rateValue')).toBeDefined()
    expect(screen.getByText('$0.0000160')).toBeDefined()

    fireEvent.press(screen.getByLabelText('explore.earn.vault.viewDetails'))
    expect(onPositionPress).toHaveBeenCalledWith(vault, position)
  })
})
