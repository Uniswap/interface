import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EARN_LAUNCH_STABLECOIN_SYMBOLS } from 'uniswap/src/features/earn/launchAssets'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { isWrappedNativeCurrencyId } from 'uniswap/src/features/earn/utils'
import { areCurrencyIdsEqual, buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'

export function getEarnVaultWithdrawDestinationCurrencyId({
  destinationChainId,
  vault,
}: {
  destinationChainId: UniverseChainId
  vault: Pick<EarnVaultInfo, 'chainId' | 'currencyId'>
}): string | undefined {
  if (isWrappedNativeCurrencyId(vault.currencyId)) {
    return buildNativeCurrencyId(destinationChainId)
  }

  if (destinationChainId === vault.chainId) {
    return vault.currencyId
  }

  return getMatchingStablecoinDestinationCurrencyId({
    destinationChainId,
    vault,
  })
}

function getMatchingStablecoinDestinationCurrencyId({
  destinationChainId,
  vault,
}: {
  destinationChainId: UniverseChainId
  vault: Pick<EarnVaultInfo, 'chainId' | 'currencyId'>
}): string | undefined {
  const sourceTokens = getChainInfo(vault.chainId).tokens
  const destinationTokens = getChainInfo(destinationChainId).tokens

  for (const symbol of EARN_LAUNCH_STABLECOIN_SYMBOLS) {
    const sourceToken = sourceTokens[symbol]
    const destinationToken = destinationTokens[symbol]

    if (
      sourceToken &&
      destinationToken &&
      areCurrencyIdsEqual(vault.currencyId, buildCurrencyId(vault.chainId, sourceToken.address))
    ) {
      return buildCurrencyId(destinationChainId, destinationToken.address)
    }
  }

  return undefined
}
