import type { UniverseChainId } from '@universe/chains'
import type { ChartPoint } from 'uniswap/src/components/charts/computeChartPaths'
import type { RWAIssuerDisplay } from 'uniswap/src/features/rwa/types'

interface TokenCardShellProps {
  onPress?: () => void
  width: number
  testID?: string
}

interface TokenCardContentBase {
  logoUrl?: string | null
  chainId?: UniverseChainId
  name?: string
  symbol?: string
  pricePercentChange1d?: number
  sparkline: ChartPoint[]
  hideNetworkLogo?: boolean
}

export type TokenCardHorizontalProps = TokenCardContentBase

export interface TokenCardVerticalProps extends TokenCardContentBase {
  issuer?: RWAIssuerDisplay
  /** Formatted internally as FiatTokenPrice. */
  priceUsd?: number
}

export type TokenCardProps = TokenCardShellProps &
  (({ layout: 'horizontal' } & TokenCardHorizontalProps) | ({ layout: 'vertical' } & TokenCardVerticalProps))
