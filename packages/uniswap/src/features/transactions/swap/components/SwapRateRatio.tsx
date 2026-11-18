import { ExchangeRate } from '@universe/transactions-ui'
import {
  type SwapRateInputs,
  useSwapRateDisplay,
} from 'uniswap/src/features/transactions/swap/hooks/useSwapRateDisplay'

type SwapRateRatioProps = SwapRateInputs & {
  styling?: 'primary' | 'secondary'
  initialInverse?: boolean
  justifyContent?: 'flex-end' | 'flex-start'
}

/**
 * Adapter: derives both rate directions from the trade and renders ExchangeRate.
 * Same export and props as before, so callers are unchanged.
 */
export function SwapRateRatio({
  trade,
  derivedSwapInfo,
  styling = 'primary',
  initialInverse = false,
  justifyContent = 'flex-start',
}: SwapRateRatioProps): JSX.Element | null {
  const rate = useSwapRateDisplay({ trade, derivedSwapInfo })

  if (!rate) {
    return null
  }

  return (
    <ExchangeRate
      align={justifyContent === 'flex-end' ? 'end' : 'start'}
      defaultInverted={initialInverse}
      rate={rate}
      styling={styling}
    />
  )
}
