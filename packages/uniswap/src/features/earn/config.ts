import { DynamicConfigs, EarnConfigKey, useDynamicConfigValue } from '@universe/gating'

export const EARN_MIN_DEPOSIT_USD = 5
export const EARN_SWAP_TOGGLE_MONTHLY_EARNINGS_THRESHOLD_USD = 5_000

function getPositiveUsdConfigValue(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback
}

export function useEarnMinDepositUsd(): number {
  const minDepositUsd = useDynamicConfigValue({
    config: DynamicConfigs.Earn,
    key: EarnConfigKey.MinDepositUsd,
    defaultValue: EARN_MIN_DEPOSIT_USD,
  })

  return getPositiveUsdConfigValue(minDepositUsd, EARN_MIN_DEPOSIT_USD)
}

export function useEarnSwapToggleMonthlyEarningsThresholdUsd(): number {
  const thresholdUsd = useDynamicConfigValue({
    config: DynamicConfigs.Earn,
    key: EarnConfigKey.SwapToggleMonthlyEarningsThresholdUsd,
    defaultValue: EARN_SWAP_TOGGLE_MONTHLY_EARNINGS_THRESHOLD_USD,
  })

  return getPositiveUsdConfigValue(thresholdUsd, EARN_SWAP_TOGGLE_MONTHLY_EARNINGS_THRESHOLD_USD)
}
