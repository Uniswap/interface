import type { TieredNetworkOptions } from 'uniswap/src/components/network/NetworkFilterV2/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { WITHDRAW_DESTINATION_CHAIN_IDS } from 'uniswap/src/features/earn/constants'

export function getWithdrawDestinationChainIds({
  isTestnetModeEnabled,
}: {
  isTestnetModeEnabled: boolean
}): UniverseChainId[] {
  return WITHDRAW_DESTINATION_CHAIN_IDS.filter((chainId) => isTestnetChain(chainId) === isTestnetModeEnabled)
}

export function getWithdrawDestinationBalanceUsd({
  chainId,
  tieredNetworkOptions,
}: {
  chainId: UniverseChainId
  tieredNetworkOptions?: TieredNetworkOptions
}): number | undefined {
  return [...(tieredNetworkOptions?.withBalances ?? []), ...(tieredNetworkOptions?.otherNetworks ?? [])].find(
    (option) => option.chainId === chainId,
  )?.balanceUSD
}
