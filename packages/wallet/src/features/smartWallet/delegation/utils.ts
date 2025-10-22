import type { TransactionRequest } from '@ethersproject/providers'
import { TradingApi } from '@universe/api'
import { checkWalletDelegation } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/defaults'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { Logger } from 'utilities/src/logger/logger'
import type { DelegationCheckResult } from 'wallet/src/features/smartWallet/delegation/types'
import { DelegationType } from 'wallet/src/features/transactions/types/transactionSagaDependencies'
import type { SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'

/**
 * Checks if the account needs delegation on the specified chain
 * @param address - The address to check delegation for
 * @param chainId - The chain ID to check delegation on
 * @returns - Object containing delegation status and addresses
 */
export async function getAccountDelegationDetails(address: Address, chainId?: number): Promise<DelegationCheckResult> {
  if (!chainId) {
    return { needsDelegation: false }
  }

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
 * Determines delegation requirements for transactions based on delegation type and transaction context
 */
export async function getDelegationInfoForTransaction(params: {
  delegationType: DelegationType
  activeAccount: SignerMnemonicAccount
  chainId: UniverseChainId
  transactionRequest?: TransactionRequest
  logger: Logger
}): Promise<DelegationCheckResult> {
  const { delegationType, activeAccount, chainId, transactionRequest, logger } = params

  const isSelfTransaction = (): boolean => {
    return transactionRequest?.to?.toLowerCase() === activeAccount.address.toLowerCase()
  }

  switch (delegationType) {
    case DelegationType.RemoveDelegation:
      return {
        needsDelegation: true,
        contractAddress: DEFAULT_NATIVE_ADDRESS,
      }

    case DelegationType.Auto:
      if (!activeAccount.smartWalletConsent || !isSelfTransaction() || !transactionRequest?.data) {
        return { needsDelegation: false }
      }

      return getAccountDelegationDetails(activeAccount.address, chainId)

    case DelegationType.Delegate:
      if (!activeAccount.smartWalletConsent || !isSelfTransaction()) {
        logger.warn(
          'getDelegationInfoForTransaction',
          'getDelegationInfo',
          'Delegation skipped: no smart wallet consent or non-self transaction',
          {
            accountAddress: activeAccount.address,
            accountType: activeAccount.type,
            hasSmartWalletConsent: activeAccount.smartWalletConsent,
            chainId,
            transactionTo: transactionRequest?.to,
            delegationType,
            isSelfTransaction: isSelfTransaction(),
            reason: 'delegation_no_consent',
          },
        )
        return { needsDelegation: false }
      }

      return getAccountDelegationDetails(activeAccount.address, chainId)

    default:
      return { needsDelegation: false }
  }
}

/**
 * Checks if the account needs delegation for a given chain
 * @param delegationDetails - The delegation details for the account and chain
 * @returns - True if the account is on a chain that needs delegation, false otherwise
 */
export function doesAccountNeedDelegationForChain(delegationDetails: TradingApi.DelegationDetails): boolean {
  return isFreshDelegation(delegationDetails) || isUpgradeUniswapDelegation(delegationDetails)
}

/**
 * Returns true if the current delegation is to a non-Uniswap address
 */
export function isNonUniswapDelegation(details: TradingApi.DelegationDetails): boolean {
  return !!details.currentDelegationAddress && !details.isWalletDelegatedToUniswap
}

/**
 * Returns true if this is a fresh delegation (no current delegation, but there is a latest delegation address)
 */
export function isFreshDelegation(details: TradingApi.DelegationDetails): boolean {
  return !details.currentDelegationAddress && !!details.latestDelegationAddress
}

/**
 * Returns true if the wallet is delegated to Uniswap and the latest delegation address is different from the current
 */
export function isUpgradeUniswapDelegation(details: TradingApi.DelegationDetails): boolean {
  return details.isWalletDelegatedToUniswap && details.latestDelegationAddress !== details.currentDelegationAddress
}
