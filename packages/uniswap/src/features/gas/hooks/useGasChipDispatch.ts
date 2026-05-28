import { useEnableCustomGasFeeEntry } from 'uniswap/src/features/gas/hooks/useEnableCustomGasFeeEntry'

export type GasChipAction = { type: 'auto-tooltip' } | { type: 'editor' } | { type: 'crosschain-not-supported' }

/**
 * Decides what to do when the user taps the gas chip on the swap form.
 *
 * - custom entry off: show the educational tooltip
 * - custom entry on + crosschain: show the "not supported" modal
 * - custom entry on + same-chain: open the Network cost editor
 *
 * The caller supplies `isCrossChain` from whatever source they already have
 * (e.g. `state.isCrossChain` on `SwapFormScreenStore` for swap flows;
 * `false` for dapp tx flows which are single-chain by definition).
 */
export function useGasChipDispatch(args: { isCrossChain: boolean }): { dispatch: () => GasChipAction } {
  const enableCustomGasFeeEntry = useEnableCustomGasFeeEntry()

  const dispatch = (): GasChipAction => {
    if (!enableCustomGasFeeEntry) {
      return { type: 'auto-tooltip' }
    }
    if (args.isCrossChain) {
      return { type: 'crosschain-not-supported' }
    }
    return { type: 'editor' }
  }

  return { dispatch }
}
