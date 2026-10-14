import { isExtensionApp } from '@universe/environment'
import { BlastShutdownSelectionModal } from 'uniswap/src/features/chains/blastShutdown/BlastShutdownSelectionModal'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

/** Opens when the swap's input or output is a Blast token; a dismissal holds for that selection for the session. */
export function BlastShutdownSwapModal(): JSX.Element | null {
  const currencies = useSwapFormStoreDerivedSwapInfo((s) => s.currencies)

  if (isExtensionApp) {
    return null
  }

  return <BlastShutdownSelectionModal currencies={Object.values(currencies)} />
}
