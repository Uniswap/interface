import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { getEarnVaultWithdrawDestinationChainIds } from 'uniswap/src/features/earn/withdrawDestination'

export function getWithdrawDestinationChainIds({
  isTestnetModeEnabled,
  vault,
}: {
  isTestnetModeEnabled: boolean
  vault: Pick<EarnVaultInfo, 'chainId' | 'currencyId'>
}): UniverseChainId[] {
  return getEarnVaultWithdrawDestinationChainIds({ vault }).filter(
    (chainId) => isTestnetChain(chainId) === isTestnetModeEnabled,
  )
}

export function getSelectedWithdrawDestinationChainId({
  initialChainId,
  selectedChainId,
  withdrawDestinationChainIds,
}: {
  initialChainId: UniverseChainId
  selectedChainId: UniverseChainId
  withdrawDestinationChainIds: UniverseChainId[]
}): UniverseChainId | undefined {
  if (withdrawDestinationChainIds.includes(selectedChainId)) {
    return selectedChainId
  }
  if (withdrawDestinationChainIds.includes(initialChainId)) {
    return initialChainId
  }
  return withdrawDestinationChainIds[0]
}
