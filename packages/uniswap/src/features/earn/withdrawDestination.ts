import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getEarnWithdrawDestinationChainIds } from 'uniswap/src/features/earn/constants'
import { EARN_LAUNCH_STABLECOIN_SYMBOLS } from 'uniswap/src/features/earn/launchAssets'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { isWrappedNativeCurrencyId } from 'uniswap/src/features/earn/utils'
import { areCurrencyIdsEqual, buildCurrencyId, buildNativeCurrencyId, currencyId } from 'uniswap/src/utils/currencyId'

// Backend-routable Earn overrides for chains without a routable canonical USDT in chainInfo.
const EARN_USDT_WITHDRAW_DESTINATION_ADDRESS_BY_CHAIN_ID: Partial<Record<UniverseChainId, string>> = {
  [UniverseChainId.Base]: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
  [UniverseChainId.Unichain]: '0x9151434b16b9763660705744891fA906F660EcC5',
  [UniverseChainId.Zksync]: '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C',
}

export function getEarnVaultWithdrawDestinationChainIds({
  vault,
}: {
  vault: Pick<EarnVaultInfo, 'chainId' | 'currencyId'>
}): UniverseChainId[] {
  return getEarnWithdrawDestinationChainIds().filter(
    (destinationChainId) => getEarnVaultWithdrawDestinationCurrencyId({ destinationChainId, vault }) !== undefined,
  )
}

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
    const destinationTokenAddress =
      symbol === 'USDT'
        ? (EARN_USDT_WITHDRAW_DESTINATION_ADDRESS_BY_CHAIN_ID[destinationChainId] ?? destinationToken?.address)
        : destinationToken?.address

    if (sourceToken && destinationTokenAddress && areCurrencyIdsEqual(vault.currencyId, currencyId(sourceToken))) {
      return buildCurrencyId(destinationChainId, destinationTokenAddress)
    }
  }

  return undefined
}
