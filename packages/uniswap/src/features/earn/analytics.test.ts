import {
  EarnAnalyticsSurface,
  EarnEntryPoint,
  getEarnVaultAnalyticsProperties,
  logEarnSwapUpsellToggleChanged,
  logEarnTransactionEvent,
  logEarnVaultSelected,
} from 'uniswap/src/features/earn/analytics'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { EarnEventName } from 'uniswap/src/features/telemetry/constants/features'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

const mockSendAnalyticsEvent = vi.mocked(sendAnalyticsEvent)
const MAINNET_CHAIN_ID = 1

const VAULT: EarnVaultInfo = {
  id: '1-0xvault',
  currencyId: `${MAINNET_CHAIN_ID}-0xunderlying`,
  displayCurrencyId: `${MAINNET_CHAIN_ID}-0xunderlying`,
  vaultAddress: '0xvault',
  chainId: MAINNET_CHAIN_ID,
  apyPercent: 4.5,
  exposureCurrencyIds: [],
  totalDepositsUsd: 1_000_000,
  liquidityUsd: 500_000,
  curator: { name: 'Morpho' },
}

const POSITION: EarnPositionInfo = {
  vaultId: VAULT.id,
  depositedUsd: 25,
  depositedRaw: '25000000',
  apyPercent: 4.5,
  sharesRaw: '24000000',
}

describe('Earn analytics', () => {
  beforeEach(() => {
    mockSendAnalyticsEvent.mockClear()
  })

  it('builds stable vault properties from vault and position metadata', () => {
    expect(
      getEarnVaultAnalyticsProperties({
        entryPoint: EarnEntryPoint.PortfolioEarnSection,
        position: POSITION,
        surface: EarnAnalyticsSurface.Web,
        underlyingTokenSymbol: 'USDC',
        vault: VAULT,
      }),
    ).toEqual({
      surface: 'web',
      entry_point: 'portfolio_earn_section',
      vault_id: '1-0xvault',
      vault_address: '0xvault',
      vault_chain_id: MAINNET_CHAIN_ID,
      underlying_token_address: '0xunderlying',
      underlying_token_symbol: 'USDC',
      underlying_chain_id: MAINNET_CHAIN_ID,
      has_existing_position: true,
      position_balance_usd: 25,
    })
  })

  it('omits optional position data for users without a vault position', () => {
    expect(
      getEarnVaultAnalyticsProperties({
        entryPoint: EarnEntryPoint.ExploreChip,
        surface: EarnAnalyticsSurface.Web,
        vault: VAULT,
      }),
    ).toEqual(
      expect.objectContaining({
        has_existing_position: false,
        position_balance_usd: undefined,
      }),
    )
  })

  it('logs vault selection with Earn event names', () => {
    const properties = getEarnVaultAnalyticsProperties({
      entryPoint: EarnEntryPoint.ExploreChip,
      surface: EarnAnalyticsSurface.Web,
      vault: VAULT,
    })

    logEarnVaultSelected(properties)

    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(EarnEventName.EarnVaultSelected, properties)
  })

  it('logs action-specific transaction events', () => {
    const properties = {
      ...getEarnVaultAnalyticsProperties({
        entryPoint: EarnEntryPoint.TokenDetailsEarnSection,
        position: POSITION,
        surface: EarnAnalyticsSurface.Mobile,
        vault: VAULT,
      }),
      action: 'withdraw' as const,
      amount_usd: 10,
    }

    logEarnTransactionEvent({ action: 'withdraw', status: 'submitted', properties })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(EarnEventName.EarnWithdrawSubmitted, properties)
  })

  it('logs swap upsell interactions with toggle state', () => {
    const properties = {
      ...getEarnVaultAnalyticsProperties({
        entryPoint: EarnEntryPoint.SwapReviewToggle,
        position: POSITION,
        surface: EarnAnalyticsSurface.Web,
        vault: VAULT,
      }),
      swap_upsell_surface: 'toggle' as const,
      toggle_state: 'on' as const,
      swap_amount_usd: 5_000,
    }

    logEarnSwapUpsellToggleChanged(properties)

    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(EarnEventName.EarnSwapUpsellToggleChanged, properties)
  })
})
