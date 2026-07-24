import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import {
  getEarnVaultWithdrawDestinationChainIds,
  getEarnVaultWithdrawDestinationCurrencyId,
} from 'uniswap/src/features/earn/withdrawDestination'
import { currencyIdToChain, isCurrencyIdValid } from 'uniswap/src/utils/currencyId'

export function resolveMobileEarnAmountDestination({
  isWithdrawing,
  requestedChainId,
  vault,
}: {
  isWithdrawing: boolean
  requestedChainId: UniverseChainId
  vault: Pick<EarnVaultInfo, 'chainId' | 'currencyId'>
}): { chainId: UniverseChainId; destinationCurrencyId?: string } {
  if (!isWithdrawing) {
    return { chainId: requestedChainId }
  }

  return resolveMobileEarnWithdrawDestination({ vault, requestedChainId })
}

export function getMobileEarnWithdrawDestinationChainIds(underlyingCurrencyId?: string): UniverseChainId[] {
  if (!underlyingCurrencyId || !isCurrencyIdValid(underlyingCurrencyId)) {
    return []
  }
  const vaultChainId = currencyIdToChain(underlyingCurrencyId)
  if (vaultChainId === null) {
    return []
  }
  return getEarnVaultWithdrawDestinationChainIds({
    vault: { chainId: vaultChainId, currencyId: underlyingCurrencyId },
  })
}

export function resolveMobileEarnWithdrawDestination({
  vault,
  requestedChainId,
}: {
  vault: Pick<EarnVaultInfo, 'chainId' | 'currencyId'>
  requestedChainId: UniverseChainId
}): { chainId: UniverseChainId; destinationCurrencyId: string } {
  const eligibleChainIds = getEarnVaultWithdrawDestinationChainIds({ vault })
  const requestedCurrencyId = eligibleChainIds.includes(requestedChainId)
    ? getEarnVaultWithdrawDestinationCurrencyId({ vault, destinationChainId: requestedChainId })
    : undefined
  if (requestedCurrencyId !== undefined) {
    return { chainId: requestedChainId, destinationCurrencyId: requestedCurrencyId }
  }

  const fallbackChainId = eligibleChainIds.includes(vault.chainId) ? vault.chainId : eligibleChainIds[0]
  if (!fallbackChainId) {
    throw new Error('Expected at least one eligible withdraw destination')
  }
  const fallbackCurrencyId = getEarnVaultWithdrawDestinationCurrencyId({
    vault,
    destinationChainId: fallbackChainId,
  })
  if (!fallbackCurrencyId) {
    throw new Error('Expected the fallback chain to support the vault currency')
  }
  return { chainId: fallbackChainId, destinationCurrencyId: fallbackCurrencyId }
}
