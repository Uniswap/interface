import { GasFeeResult } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { usePrepareAndSignDappTransaction } from 'src/app/features/dappRequests/hooks/usePrepareAndSignDappTransaction'
import { useTransactionGasEstimation } from 'src/app/features/dappRequests/hooks/useTransactionGasEstimation'
import { DappRequestStoreItemForSendCallsTxn } from 'src/app/features/dappRequests/slice'
import { UNISWAP_DELEGATION_ADDRESS } from 'uniswap/src/constants/addresses'
import { useWalletEncode4337Query } from 'uniswap/src/data/apiClients/tradingApi/useWalletEncode4337Query'
import { useWalletEncode7702Query } from 'uniswap/src/data/apiClients/tradingApi/useWalletEncode7702Query'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toTradingApiSupportedChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { EthTransaction } from 'uniswap/src/types/walletConnect'
import type { RpcUserOperation } from 'viem/account-abstraction'
import {
  transformCallsToTransactionRequests,
  transformTradingApiUserOpToRpcUserOp,
} from 'wallet/src/features/batchedTransactions/utils'
import { useLiveAccountDelegationDetails } from 'wallet/src/features/smartWallet/hooks/useLiveAccountDelegationDetails'
import { SignedTransactionRequest } from 'wallet/src/features/transactions/executeTransaction/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'

interface UsePrepareAndSignSendCallsTransactionParams {
  request: DappRequestStoreItemForSendCallsTxn
  account: Account
  chainId?: UniverseChainId
}

interface UsePrepareAndSignSendCallsTransactionResult {
  gasFeeResult: GasFeeResult
  isInvalidGasFeeResult: boolean
  showSmartWalletActivation: boolean

  // 7702 path
  encodedTransactionRequest?: EthTransaction
  encodedRequestId?: string
  preSignedTransaction?: SignedTransactionRequest

  // 4337 path
  unsignedUserOperation?: RpcUserOperation<'0.8'>
}

/**
 * Hook that fetches gas information for a SendCalls dapp transaction and automatically
 * prepares and signs the transaction once gas info is available.
 *
 * When the dapp provides a paymasterService capability and the feature flag is enabled,
 * this hook uses the 4337 path (encode_4337) instead of the 7702 path (encode_7702).
 */
export function usePrepareAndSignSendCallsTransaction({
  request,
  account,
  chainId,
}: UsePrepareAndSignSendCallsTransactionParams): UsePrepareAndSignSendCallsTransactionResult {
  const is7677GasSponsorshipEnabled = useFeatureFlag(FeatureFlags.Support7677GasSponsorship)

  const paymasterCapability = request.dappRequest.capabilities?.['paymasterService'] as
    | { url?: string; context?: Record<string, unknown> }
    | undefined
  const shouldUse4337 = Boolean(paymasterCapability?.url && is7677GasSponsorshipEnabled)

  // --- 4337 path ---
  const transformedCalls = useMemo(
    () =>
      chainId
        ? transformCallsToTransactionRequests({
            calls: request.dappRequest.calls,
            chainId,
            accountAddress: account.address,
          })
        : [],
    [chainId, request.dappRequest.calls, account.address],
  )

  const supportedChainId = toTradingApiSupportedChainId(chainId)
  const {
    data: encode4337Data,
    isLoading: isEncode4337Loading,
    error: encode4337Error,
  } = useWalletEncode4337Query({
    params:
      shouldUse4337 && supportedChainId && paymasterCapability?.url && account.address
        ? {
            calls: transformedCalls,
            sender: account.address,
            chainId: supportedChainId,
            paymasterUrl: paymasterCapability.url,
            paymasterServiceContext: paymasterCapability.context,
          }
        : undefined,
  })

  // --- 7702 path ---
  const { data: encoded7702data } = useWalletEncode7702Query({
    enabled: !shouldUse4337 && !!chainId && !!account.address,
    params: {
      calls: transformedCalls,
      smartContractDelegationAddress: UNISWAP_DELEGATION_ADDRESS,
      walletAddress: account.address,
    },
  })

  const delegationData = useLiveAccountDelegationDetails({
    address: account.address,
    chainId,
  })

  const encodedTransaction = encoded7702data?.encoded
  const encodedRequestId = encoded7702data?.requestId

  // TODO(SWAP-2508): Need to handle case where userOp fails sponsored: should still fetch gas estimation for userOps
  const { gasFeeResult, isInvalidGasFeeResult } = useTransactionGasEstimation({
    baseTx: shouldUse4337 ? undefined : encodedTransaction,
    chainId,
    skip: shouldUse4337 || !encodedTransaction?.to,
    smartContractDelegationAddress: delegationData?.contractAddress,
  })

  const encodedTransactionRequestWithGasInfo: EthTransaction | undefined = useMemo(
    () =>
      !shouldUse4337 && encodedTransaction && gasFeeResult.params && !isInvalidGasFeeResult && chainId
        ? {
            ...encodedTransaction,
            ...gasFeeResult.params,
            chainId,
          }
        : undefined,
    [shouldUse4337, encodedTransaction, gasFeeResult, isInvalidGasFeeResult, chainId],
  )

  const { preSignedTransaction } = usePrepareAndSignDappTransaction({
    request: shouldUse4337 ? undefined : encodedTransactionRequestWithGasInfo,
    account,
    chainId,
  })

  const effectiveGasFeeResult: GasFeeResult = shouldUse4337
    ? { value: '0', isLoading: isEncode4337Loading, error: encode4337Error ?? null }
    : gasFeeResult

  return {
    gasFeeResult: effectiveGasFeeResult,
    isInvalidGasFeeResult,
    showSmartWalletActivation: delegationData?.needsDelegation ?? false,

    // 7702 path fields
    encodedTransactionRequest: encodedTransactionRequestWithGasInfo,
    encodedRequestId,
    preSignedTransaction,

    // 4337 path fields
    unsignedUserOperation: encode4337Data?.userOperation
      ? transformTradingApiUserOpToRpcUserOp(encode4337Data.userOperation)
      : undefined,
  }
}
