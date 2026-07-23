import { PortfolioBalancePart } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'

export enum PortfolioRelativeChangeDisplay {
  Change = 'change',
  Unavailable = 'unavailable',
  Omit = 'omit',
}

interface GetPortfolioRelativeChangeDisplayParams {
  enabled: boolean
  part: PortfolioBalancePart
  /** True when the backend omitted the 1D percent change (`undefined`, not a valid `0`). */
  backendPercentChangeUnavailable: boolean
  /** True when a chart-derived percent change overrides the raw backend value. */
  hasOverride: boolean
  hidePercentChange?: boolean
  isLoading: boolean
}

/**
 * Decides what to render for the portfolio 1D percent change. The unavailable/omit branches apply
 * only when opt-in categories were requested (`enabled`) and on surfaces that show the raw backend
 * value (no chart-derived override).
 */
export function getPortfolioRelativeChangeDisplay({
  enabled,
  part,
  backendPercentChangeUnavailable,
  hasOverride,
  hidePercentChange,
  isLoading,
}: GetPortfolioRelativeChangeDisplayParams): PortfolioRelativeChangeDisplay {
  const showUnavailableState = enabled && !hasOverride && !isLoading && backendPercentChangeUnavailable

  // Total balance: replace the relative change with an explicit "1D change unavailable" message.
  if (showUnavailableState && part === PortfolioBalancePart.Total && !hidePercentChange) {
    return PortfolioRelativeChangeDisplay.Unavailable
  }

  // Pools summary (only rendered on the web Pools tab): drop the change line entirely so the
  // summary shows just the balance and position count.
  if (showUnavailableState && part === PortfolioBalancePart.Pools) {
    return PortfolioRelativeChangeDisplay.Omit
  }

  return PortfolioRelativeChangeDisplay.Change
}
