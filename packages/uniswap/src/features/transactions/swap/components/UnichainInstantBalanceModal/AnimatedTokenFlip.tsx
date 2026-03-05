import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

export interface AnimatedTokenFlipProps {
  size: number
  inputCurrencyInfo: CurrencyInfo
  outputCurrencyInfo: CurrencyInfo
}

/**
 * Platform-specific implementations:
 * - Web: Uses CSS transitions (AnimatedTokenFlip.web.tsx)
 * - Native: Uses react-native-reanimated (AnimatedTokenFlip.native.tsx)
 */
export function AnimatedTokenFlip(_props: AnimatedTokenFlipProps): JSX.Element {
  throw new Error('AnimatedTokenFlip: Implemented in `.native.tsx` and `.web.tsx` files')
}
