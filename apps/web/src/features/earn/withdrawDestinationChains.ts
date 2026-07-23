import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { getEarnWithdrawDestinationChainIds } from 'uniswap/src/features/earn/constants'

export function getWithdrawDestinationChainIds({
  isTestnetModeEnabled,
}: {
  isTestnetModeEnabled: boolean
}): UniverseChainId[] {
  return getEarnWithdrawDestinationChainIds().filter((chainId) => isTestnetChain(chainId) === isTestnetModeEnabled)
}
