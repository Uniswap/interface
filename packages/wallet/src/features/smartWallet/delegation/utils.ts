import { checkWalletDelegation } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { DelegationDetails } from 'uniswap/src/data/tradingApi/__generated__/models/DelegationDetails'
import { DelegationCheckResult } from 'wallet/src/features/smartWallet/delegation/types'

/**
 * Checks if the account needs delegation on the specified chain
 * @param address - The address to check delegation for
 * @param chainId - The chain ID to check delegation on
 * @returns - Object containing delegation status and addresses
 */
export async function getAccountDelegationDetails(address: Address, chainId: number): Promise<DelegationCheckResult> {
  const delegationDetails = await checkWalletDelegation({
    walletAddresses: [address],
    chainIds: [chainId],
  })

  const delegationDetailsForWalletAndChain = delegationDetails.delegationDetails[address]?.[chainId]
  if (!delegationDetailsForWalletAndChain) {
    return { needsDelegation: false }
  }

  if (isNonUniswapDelegation(delegationDetailsForWalletAndChain)) {
    return { needsDelegation: false }
  }

  return {
    needsDelegation: doesAccountNeedDelegationForChain(delegationDetailsForWalletAndChain),
    contractAddress: delegationDetailsForWalletAndChain.latestDelegationAddress,
    currentDelegationAddress: delegationDetailsForWalletAndChain.currentDelegationAddress,
    latestDelegationAddress: delegationDetailsForWalletAndChain.latestDelegationAddress,
    isWalletDelegatedToUniswap: delegationDetailsForWalletAndChain.isWalletDelegatedToUniswap,
  }
}

/**
 * Checks if the account needs delegation for a given chain
 * @param delegationDetails - The delegation details for the account and chain
 * @returns - True if the account is on a chain that needs delegation, false otherwise
 */
export function doesAccountNeedDelegationForChain(delegationDetails: DelegationDetails): boolean {
  return isFreshDelegation(delegationDetails) || isUpgradeUniswapDelegation(delegationDetails)
}

/**
 * Returns true if the current delegation is to a non-Uniswap address
 */
export function isNonUniswapDelegation(details: DelegationDetails): boolean {
  return !!details.currentDelegationAddress && !details.isWalletDelegatedToUniswap
}

/**
 * Returns true if this is a fresh delegation (no current delegation, but there is a latest delegation address)
 */
export function isFreshDelegation(details: DelegationDetails): boolean {
  return !details.currentDelegationAddress && !!details.latestDelegationAddress
}

/**
 * Returns true if the wallet is delegated to Uniswap and the latest delegation address is different from the current
 */
export function isUpgradeUniswapDelegation(details: DelegationDetails): boolean {
  return details.isWalletDelegatedToUniswap && details.latestDelegationAddress !== details.currentDelegationAddress
}
