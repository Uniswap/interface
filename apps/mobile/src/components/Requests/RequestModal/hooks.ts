import { GasFeeResult } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useChainGasToken } from 'uniswap/src/features/gas/hooks/useChainGasToken'
import { hasSufficientGasBalance } from 'uniswap/src/features/gas/utils'

export function useHasSufficientFunds({
  account,
  chainId,
  gasFee,
  value,
}: {
  account?: string
  chainId?: UniverseChainId
  gasFee: GasFeeResult
  value?: string
}): boolean {
  const { defaultChainId } = useEnabledChains()
  const effectiveChainId = chainId ?? defaultChainId
  const { gasBalance } = useChainGasToken({ chainId: effectiveChainId, accountAddress: account })

  return hasSufficientGasBalance({
    chainId: effectiveChainId,
    gasBalance,
    gasFee: gasFee.value,
    spend: value ? { kind: 'raw-native-value', value } : undefined,
  })
}
