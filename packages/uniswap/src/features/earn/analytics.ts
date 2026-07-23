import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { EarnEventName } from 'uniswap/src/features/telemetry/constants/features'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type {
  EarnAnalyticsBaseProperties,
  EarnAnalyticsEntryPoint,
  EarnAnalyticsSurface as EarnAnalyticsSurfaceValue,
  EarnSwapUpsellAnalyticsProperties,
  EarnSwapUpsellSurface as EarnSwapUpsellSurfaceValue,
  EarnTransactionAnalyticsProperties,
} from 'uniswap/src/features/telemetry/types'

export const EarnAnalyticsSurface = {
  Extension: 'extension',
  Mobile: 'mobile',
  Web: 'web',
} as const satisfies Record<string, EarnAnalyticsSurfaceValue>

export const EarnEntryPoint = {
  Activity: 'activity',
  ExploreChip: 'explore_chip',
  GlobalModal: 'global_modal',
  PortfolioEarnGetToken: 'portfolio_earn_get_token',
  PortfolioEarnSection: 'portfolio_earn_section',
  PostSwapUpsellToast: 'post_swap_upsell_toast',
  SwapReviewToggle: 'swap_review_toggle',
  TokenDetailsEarnBanner: 'tdp_earn_banner',
  TokenDetailsEarnSection: 'tdp_earn_section',
  TokenDetailsVaultShareBanner: 'tdp_vault_share_banner',
} as const satisfies Record<string, EarnAnalyticsEntryPoint>

export const EarnSwapUpsellSurface = {
  Toast: 'toast',
  Toggle: 'toggle',
} as const satisfies Record<string, EarnSwapUpsellSurfaceValue>

const MONTHS_PER_YEAR = 12

export function getProjectedMonthlyEarningsUsd({
  apyPercent,
  amountUsd,
}: {
  apyPercent: number | undefined
  amountUsd: number | undefined
}): number | undefined {
  if (amountUsd === undefined || apyPercent === undefined) {
    return undefined
  }

  return (amountUsd * apyPercent) / 100 / MONTHS_PER_YEAR
}

function getCurrencyIdParts(
  currencyId: string | undefined,
): Pick<EarnAnalyticsBaseProperties, 'underlying_chain_id' | 'underlying_token_address'> {
  if (!currencyId) {
    return {}
  }

  const [chainId, address] = currencyId.split('-')
  const parsedChainId = Number(chainId)

  return {
    underlying_chain_id: Number.isFinite(parsedChainId)
      ? (parsedChainId as EarnAnalyticsBaseProperties['underlying_chain_id'])
      : undefined,
    underlying_token_address: address,
  }
}

function isPositiveRawAmount(rawAmount: string): boolean {
  const rawAmountTrimmed = rawAmount.trim()
  if (!rawAmountTrimmed) {
    return false
  }

  try {
    return BigInt(rawAmountTrimmed) > BigInt(0)
  } catch {
    return Number(rawAmountTrimmed) > 0
  }
}

function hasPositionBalance(position: EarnPositionInfo | undefined): boolean {
  if (!position) {
    return false
  }

  return (
    position.depositedUsd > 0 || isPositiveRawAmount(position.depositedRaw) || isPositiveRawAmount(position.sharesRaw)
  )
}

export function getEarnVaultAnalyticsProperties({
  entryPoint,
  position,
  surface,
  underlyingTokenSymbol,
  vault,
}: {
  entryPoint: EarnAnalyticsEntryPoint
  position?: EarnPositionInfo
  surface: EarnAnalyticsSurfaceValue
  underlyingTokenSymbol?: string
  vault: EarnVaultInfo
}): EarnAnalyticsBaseProperties {
  const currencyIdParts = getCurrencyIdParts(vault.currencyId)

  return {
    surface,
    entry_point: entryPoint,
    vault_id: vault.id,
    vault_address: vault.vaultAddress,
    vault_chain_id: vault.chainId,
    underlying_token_address: currencyIdParts.underlying_token_address,
    underlying_token_symbol: underlyingTokenSymbol,
    underlying_chain_id: currencyIdParts.underlying_chain_id ?? vault.chainId,
    has_existing_position: hasPositionBalance(position),
    position_balance_usd: position?.depositedUsd,
  }
}

export function logEarnVaultSelected(properties: EarnAnalyticsBaseProperties): void {
  sendAnalyticsEvent(EarnEventName.EarnVaultSelected, properties)
}

export function logEarnTransactionEvent({
  action,
  properties,
  status,
}: {
  action: 'deposit' | 'withdraw'
  properties: EarnTransactionAnalyticsProperties
  status: 'started' | 'submitted' | 'completed' | 'failed'
}): void {
  const eventNameByAction = {
    deposit: {
      completed: EarnEventName.EarnDepositCompleted,
      failed: EarnEventName.EarnDepositFailed,
      started: EarnEventName.EarnDepositStarted,
      submitted: EarnEventName.EarnDepositSubmitted,
    },
    withdraw: {
      completed: EarnEventName.EarnWithdrawCompleted,
      failed: EarnEventName.EarnWithdrawFailed,
      started: EarnEventName.EarnWithdrawStarted,
      submitted: EarnEventName.EarnWithdrawSubmitted,
    },
  } as const

  sendAnalyticsEvent(eventNameByAction[action][status], properties)
}

export function logEarnSwapUpsellToastShown(properties: EarnSwapUpsellAnalyticsProperties): void {
  sendAnalyticsEvent(EarnEventName.EarnSwapUpsellToastShown, properties)
}

export function logEarnSwapUpsellToastClicked(properties: EarnSwapUpsellAnalyticsProperties): void {
  sendAnalyticsEvent(EarnEventName.EarnSwapUpsellToastClicked, properties)
}

export function logEarnSwapUpsellToastDismissed(properties: EarnSwapUpsellAnalyticsProperties): void {
  sendAnalyticsEvent(EarnEventName.EarnSwapUpsellToastDismissed, properties)
}

export function logEarnSwapUpsellToggleShown(properties: EarnSwapUpsellAnalyticsProperties): void {
  sendAnalyticsEvent(EarnEventName.EarnSwapUpsellToggleShown, properties)
}

export function logEarnSwapUpsellToggleChanged(properties: EarnSwapUpsellAnalyticsProperties): void {
  sendAnalyticsEvent(EarnEventName.EarnSwapUpsellToggleChanged, properties)
}

export function logEarnSwapUpsellConverted(properties: EarnSwapUpsellAnalyticsProperties): void {
  sendAnalyticsEvent(EarnEventName.EarnSwapUpsellConverted, properties)
}
