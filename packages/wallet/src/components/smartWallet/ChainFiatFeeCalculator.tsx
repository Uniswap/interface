import { useChainFiatFee } from 'wallet/src/features/smartWallet/hooks/useChainFiatFee'

interface ChainFiatFeeCalculatorProps {
  chainId: number
  gasFeeDisplayValue?: string
  onFetched: (chainId: number, amount: number) => void
  onError: (error: boolean) => void
}

/**
 * This component is designed to handle variable numbers of chain fee calculations.
 * Since React hooks cannot be called conditionally or in loops, we create individual
 * components for each chain calculation. Each component instance calls the hook once
 * and communicates results back via callback props.
 */
export const ChainFiatFeeCalculator = ({
  chainId,
  gasFeeDisplayValue,
  onFetched,
  onError,
}: ChainFiatFeeCalculatorProps): null => {
  useChainFiatFee({ chainId, gasFeeDisplayValue, onFetched, onError })
  return null
}
