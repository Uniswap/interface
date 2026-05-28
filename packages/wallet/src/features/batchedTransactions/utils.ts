import { TradingApi } from '@universe/api'
import { generateRandomBytes } from '@universe/cryptography'
import { ensure0xHex, numberToHex, uint8ToHex, parseHex, parseOptionalHex } from '@universe/encoding'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { checkWalletDelegation } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { DappResponseType } from 'uniswap/src/features/dappRequests/types'
import { EthTransaction } from 'uniswap/src/types/walletConnect'
import { logger } from 'utilities/src/logger/logger'
import type { RpcAuthorization } from 'viem'
import type { RpcUserOperation } from 'viem/account-abstraction'
import { Capability } from 'wallet/src/features/dappRequests/types'
import { isFreshDelegation } from 'wallet/src/features/smartWallet/delegation/utils'

/**
 * Generates a random batch ID in the format of 0x followed by 64 hex characters
 * @returns A string in the format of 0x followed by 64 hex characters
 */
export function generateBatchId(): string {
  return ensure0xHex(uint8ToHex(generateRandomBytes(32)))
}

/**
 * Transforms an array of EIP-1193 calls into TransactionRequest format for the Trading API.
 * Filters out any calls missing required fields.
 */
export function transformCallsToTransactionRequests({
  calls,
  chainId,
  accountAddress,
}: {
  calls: EthTransaction[]
  chainId: number
  accountAddress: Address
}): TradingApi.TransactionRequest[] {
  return calls
    .map((call): TradingApi.TransactionRequest | undefined => {
      if (call.to === undefined || call.data === undefined || !chainId) {
        return undefined
      }
      return {
        to: call.to,
        data: call.data,
        value: call.value ?? '0x0',
        from: accountAddress,
        chainId: chainId.valueOf(),
      }
    })
    .filter((call): call is TradingApi.TransactionRequest => !!call)
}

function transformEip7702Auth(auth: TradingApi.Eip7702Authorization): RpcAuthorization {
  return {
    address: parseHex(auth.address),
    chainId: parseHex(auth.chainId),
    nonce: parseHex(auth.nonce),
    r: parseHex(auth.r),
    s: parseHex(auth.s),
    yParity: parseHex(auth.yParity),
  }
}

/**
 * Transforms a Trading API ERC-4337 v0.8 `UserOperation` into viem's
 * `RpcUserOperation<'0.8'>` shape. Throws if any field is not a valid hex string.
 */
export function transformTradingApiUserOpToRpcUserOp(userOp: TradingApi.UserOperation): RpcUserOperation<'0.8'> {
  return {
    sender: parseHex(userOp.sender),
    nonce: parseHex(userOp.nonce),
    callData: parseHex(userOp.callData),
    callGasLimit: parseHex(userOp.callGasLimit),
    verificationGasLimit: parseHex(userOp.verificationGasLimit),
    preVerificationGas: parseHex(userOp.preVerificationGas),
    maxFeePerGas: parseHex(userOp.maxFeePerGas),
    maxPriorityFeePerGas: parseHex(userOp.maxPriorityFeePerGas),
    signature: parseHex(userOp.signature),
    factory: parseOptionalHex(userOp.factory),
    factoryData: parseOptionalHex(userOp.factoryData),
    paymaster: parseOptionalHex(userOp.paymaster),
    paymasterVerificationGasLimit: parseOptionalHex(userOp.paymasterVerificationGasLimit),
    paymasterPostOpGasLimit: parseOptionalHex(userOp.paymasterPostOpGasLimit),
    paymasterData: parseOptionalHex(userOp.paymasterData),
    eip7702Auth: userOp.eip7702Auth ? transformEip7702Auth(userOp.eip7702Auth) : undefined,
  }
}

export function getCapabilitiesForDelegationStatus(
  delegationStatus: TradingApi.ChainDelegationMap | undefined,
  hasSmartWalletConsent: boolean,
): Record<string, Capability> {
  if (!delegationStatus) {
    return {}
  }
  const is7677GasSponsorshipEnabled = getFeatureFlag(FeatureFlags.Support7677GasSponsorship)
  const capabilities: Record<string, Capability> = {}
  for (const [chainId, delegationStatusForChain] of Object.entries(delegationStatus)) {
    const chainCapability: Capability = {}

    const isDelegated = delegationStatusForChain.isWalletDelegatedToUniswap
    const isFresh = isFreshDelegation(delegationStatusForChain)

    let status: 'unsupported' | 'supported' | 'ready' = 'unsupported'
    if (hasSmartWalletConsent) {
      // If the user has consented to smart wallets, we can use the delegation status to determine the capabilities
      // & if the wallet is delegated to Uniswap, it's supported, even if the delegation address is outdated
      if (isDelegated) {
        status = 'supported'
      } else if (isFresh) {
        status = 'ready'
      }
    }

    chainCapability['atomic'] = { status }

    const isPaymasterEligible = status !== 'unsupported'
    // TODO(SWAP-2460): ensure delegation is included in userOp when isFreshDelegation
    if (is7677GasSponsorshipEnabled && isPaymasterEligible) {
      chainCapability['paymasterService'] = { supported: true }
    }

    capabilities[numberToHex(parseInt(chainId, 10))] = chainCapability
  }
  return capabilities
}

/**
 * Shared core logic for handling getCapabilities requests
 * Used by both the background script and saga implementations
 */
export async function getCapabilitiesResponse({
  request,
  chainIds,
  hasSmartWalletConsent,
}: {
  request: { requestId: string; address: string; chainIds?: string[] }
  chainIds: number[]
  hasSmartWalletConsent: boolean
}): Promise<{
  type: DappResponseType.GetCapabilitiesResponse
  requestId: string
  response: Record<string, Capability>
}> {
  const capabilities = await getCapabilitiesCore({ address: request.address, chainIds, hasSmartWalletConsent })

  return {
    type: DappResponseType.GetCapabilitiesResponse,
    requestId: request.requestId,
    response: capabilities,
  }
}
/**
 * Shared core logic for handling getCapabilities requests
 * Used by both the background script and saga implementations
 */
export async function getCapabilitiesCore({
  address,
  chainIds,
  hasSmartWalletConsent,
}: {
  address: string
  chainIds: number[]
  hasSmartWalletConsent: boolean
}): Promise<Record<string, Capability>> {
  let delegationStatusResponse: TradingApi.WalletCheckDelegationResponseBody | undefined

  try {
    delegationStatusResponse = await checkWalletDelegation({
      walletAddresses: [address],
      chainIds,
    })
  } catch (error) {
    logger.error(error, {
      tags: { file: 'batchedTransactions/utils.ts', function: 'getCapabilitiesCore' },
      extra: { address, chainIds, hasSmartWalletConsent },
    })
  }

  const capabilities = getCapabilitiesForDelegationStatus(
    delegationStatusResponse?.delegationDetails[address],
    hasSmartWalletConsent,
  )

  return capabilities
}
