import type { CurrencyInputPanelProps } from 'uniswap/src/components/CurrencyInputPanel/types'

/**
 * Returns an animated opacity based on current indicative and full quote state.
 *
 * Platform-specific implementations:
 * - Web: Uses CSS animations (useRefetchAnimationStyle.web.ts)
 * - Native: Uses react-native-reanimated (useRefetchAnimationStyle.native.ts)
 */
export function useRefetchAnimationStyle(
  _props: Pick<CurrencyInputPanelProps, 'currencyAmount' | 'isLoading' | 'isIndicativeLoading' | 'valueIsIndicative'>,
): { opacity?: number; animation?: string } {
  throw new Error('useRefetchAnimationStyle: Implemented in `.native.ts` and `.web.ts` files')
}
