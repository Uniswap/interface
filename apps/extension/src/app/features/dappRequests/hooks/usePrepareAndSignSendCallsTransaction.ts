import { skipToken, useQuery } from '@tanstack/react-query'
import { GasFeeResult, TradingApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { usePrepareAndSignDappTransaction } from 'src/app/features/dappRequests/hooks/usePrepareAndSignDappTransaction'
import { useTransactionGasEstimation } from 'src/app/features/dappRequests/hooks/useTransactionGasEstimation'
import { DappRequestStoreItemForSendCallsTxn } from 'src/app/features/dappRequests/slice'
import { useSignDelegationAuthorization } from 'uniswap/src/contexts/UniswapContext'
import { useWalletEncode4337Query } from 'uniswap/src/data/apiClients/tradingApi/useWalletEncode4337Query'
import { useWalletEncode7702Query } from 'uniswap/src/data/apiClients/tradingApi/useWalletEncode7702Query'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { buildGasServiceUrgencyOverride } from 'uniswap/src/features/gas/components/NetworkCostEditor/buildGasServiceUrgencyOverride'
import type { GasFeeOverrides } from 'uniswap/src/features/gas/types'
import { transformTradingApiUserOpToRpcUserOp } from 'uniswap/src/features/smartWallet/userOp/transformTradingApiUserOp'
import { toTradingApiSupportedChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { EthTransaction } from 'uniswap/src/types/walletConnect'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { RpcUserOperation } from 'viem/account-abstraction'
import { transformCallsToTransactionRequests } from 'wallet/src/features/batchedTransactions/utils'
import { useLiveAccountDelegationDetails } from 'wallet/src/features/smartWallet/hooks/useLiveAccountDelegationDetails'
import { SignedTransactionRequest } from 'wallet/src/features/transactions/executeTransaction/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'

interface UsePrepareAndSignSendCallsTransactionParams {
  request: DappRequestStoreItemForSendCallsTxn
  account: Account
  chainId?: UniverseChainId
  gasOverrides?: GasFeeOverrides
}

interface UsePrepareAndSignSendCallsTransactionResult {
  gasFeeResult: GasFeeResult
  isInvalidGasFeeResult: boolean
  showSmartWalletActivation: boolean
  isSponsoredUserOp: boolean
  sponsorMetadata?: TradingApi.SponsorMetadata

  // 7702 path
  encodedTransactionRequest?: EthTransaction
  encodedRequestId?: string
  preSignedTransaction?: SignedTransactionRequest

  // 4337 path
  unsignedUserOperation?: RpcUserOperation<'0.8'>
}

/**
 * Encodes a sponsored (4337) SendCalls request. When the wallet still needs EIP-7702
 * delegation, the auth is signed up front and bundled into encode_4337 so the
 * backend's server-side paymaster + bundler simulation sees an already-delegated account.
 */
function useEncode4337WithDelegationAuth({
  shouldUse4337,
  chainId,
  account,
  paymasterCapability,
  transformedCalls,
  delegationData,
}: {
  shouldUse4337: boolean
  chainId?: UniverseChainId
  account: Account
  paymasterCapability?: { url?: string; context?: Record<string, unknown> }
  transformedCalls: ReturnType<typeof transformCallsToTransactionRequests>
  delegationData: ReturnType<typeof useLiveAccountDelegationDetails>
}): {
  encode4337Data: ReturnType<typeof useWalletEncode4337Query>['data']
  isEncode4337Loading: boolean
  encode4337Error: ReturnType<typeof useWalletEncode4337Query>['error']
  isDelegationAuthLoading: boolean
} {
  const supportedChainId = toTradingApiSupportedChainId(chainId)
  const signDelegationAuthorization = useSignDelegationAuthorization()
  const delegationContractAddress = delegationData?.contractAddress
  const needsDelegationAuth = Boolean(shouldUse4337 && delegationData?.needsDelegation && delegationContractAddress)

  const { data: eip7702Auth, isLoading: isDelegationAuthLoading } = useQuery({
    queryKey: [
      ReactQueryCacheKey.WalletDelegation,
      'sendCallsAuth',
      account.address,
      chainId,
      delegationContractAddress,
    ],
    queryFn:
      needsDelegationAuth && chainId && delegationContractAddress && signDelegationAuthorization
        ? async () =>
            (await signDelegationAuthorization({
              chainId,
              sender: account.address,
              delegationAddress: delegationContractAddress,
            })) ?? null
        : skipToken,
  })

  // Don't fetch encode_4337 until the delegation auth is ready (when one is needed), otherwise
  // the backend would simulate an undelegated account and mis-estimate / reject sponsorship.
  const delegationReady = !needsDelegationAuth || Boolean(eip7702Auth)

  const {
    data: encode4337Data,
    isLoading: isEncode4337Loading,
    error: encode4337Error,
  } = useWalletEncode4337Query({
    params:
      shouldUse4337 && supportedChainId && paymasterCapability?.url && account.address && delegationReady
        ? {
            calls: transformedCalls,
            sender: account.address,
            chainId: supportedChainId,
            paymasterUrl: paymasterCapability.url,
            paymasterServiceContext: paymasterCapability.context,
            eip7702Auth: eip7702Auth ?? undefined,
          }
        : undefined,
  })

  return { encode4337Data, isEncode4337Loading, encode4337Error, isDelegationAuthLoading }
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
  gasOverrides,
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

  // When this is a first sponsored sendCalls on an undelegated wallet, the 7702
  // delegation auth is signed up front and bundled into encode_4337 (see the hook below).
  const delegationData = useLiveAccountDelegationDetails({
    address: account.address,
    chainId,
  })

  const { encode4337Data, isEncode4337Loading, encode4337Error, isDelegationAuthLoading } =
    useEncode4337WithDelegationAuth({
      shouldUse4337,
      chainId,
      account,
      paymasterCapability,
      transformedCalls,
      delegationData,
    })

  // --- 7702 path ---
  // The delegation address comes from check_delegation (via useLiveAccountDelegationDetails);
  // encoding waits until it's available.
  const delegationAddress = delegationData?.contractAddress
  const { data: encoded7702data } = useWalletEncode7702Query({
    enabled: !shouldUse4337 && !!chainId && !!account.address && !!delegationAddress,
    params: delegationAddress
      ? {
          calls: transformedCalls,
          smartContractDelegationAddress: delegationAddress,
          walletAddress: account.address,
        }
      : undefined,
  })

  const encodedTransaction = encoded7702data?.encoded
  const encodedRequestId = encoded7702data?.requestId

  // No `recommended` baseline available here — when only one of maxBaseFeeGwei /
  // priorityFeeGwei is overridden, maxFeePerGas is omitted and the gas service
  // falls back to its own estimate for that combined field.
  const { urgency, gasLimitOverride } = useMemo(() => buildGasServiceUrgencyOverride({ gasOverrides }), [gasOverrides])

  // TODO(SWAP-2508): Need to handle case where userOp fails sponsored: should still fetch gas estimation for userOps
  const { gasFeeResult, isInvalidGasFeeResult } = useTransactionGasEstimation({
    baseTx: shouldUse4337 ? undefined : encodedTransaction,
    chainId,
    skip: shouldUse4337 || !encodedTransaction?.to,
    smartContractDelegationAddress: delegationData?.contractAddress,
    urgency,
    gasLimitOverride,
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
    ? { value: '0', isLoading: isDelegationAuthLoading || isEncode4337Loading, error: encode4337Error ?? null }
    : gasFeeResult

  const sponsorMetadata = encode4337Data?.sponsorMetadata

  return {
    gasFeeResult: effectiveGasFeeResult,
    isInvalidGasFeeResult,
    showSmartWalletActivation: delegationData?.needsDelegation ?? false,
    isSponsoredUserOp: shouldUse4337,
    sponsorMetadata,

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
