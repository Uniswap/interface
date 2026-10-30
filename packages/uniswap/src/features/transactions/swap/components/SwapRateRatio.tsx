import { RateRatio } from '@universe/swap-ui'
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
 * Adapter: derives both rate orientations from the trade and renders the swap-ui view.
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

  return <RateRatio rate={rate} styling={styling} initialInverse={initialInverse} justifyContent={justifyContent} />
}
