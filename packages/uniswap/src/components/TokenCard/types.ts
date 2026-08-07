import type { ChartPoint } from 'uniswap/src/components/charts/computeChartPaths'

interface TokenCardShellProps {
  onPress?: () => void
  width: number
  testID?: string
}

interface TokenCardContentBase {
  logoUrl?: string | null
  name?: string
  symbol?: string
  pricePercentChange1d?: number
  sparkline: ChartPoint[]
  hideNetworkLogo?: boolean
}

export type TokenCardHorizontalProps = TokenCardContentBase

export interface TokenCardVerticalProps extends TokenCardContentBase {
  /** Preformatted at the call site (e.g. `formatIssuerLabel`). */
  issuerLabel?: string
  /** Formatted internally as FiatTokenPrice. */
  priceUsd?: number
}

export type TokenCardProps = TokenCardShellProps &
  (({ layout: 'horizontal' } & TokenCardHorizontalProps) | ({ layout: 'vertical' } & TokenCardVerticalProps))
