import { TradingApi } from '@universe/api'
import { checkWalletDelegation } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { DappResponseType } from 'uniswap/src/features/dappRequests/types'
import { EthTransaction } from 'uniswap/src/types/walletConnect'
import { numberToHex } from 'utilities/src/addresses/hex'
import { logger } from 'utilities/src/logger/logger'
import { Capability } from 'wallet/src/features/dappRequests/types'
import { isFreshDelegation } from 'wallet/src/features/smartWallet/delegation/utils'

/**
 * Generates a random batch ID in the format of 0x followed by 64 hex characters
 * @returns A string in the format of 0x followed by 64 hex characters
 */
export function generateBatchId(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32))
  const hexBytes = Array.from(randomBytes).map((byte) => {
    return byte.toString(16).padStart(2, '0')
  })
  return `0x${hexBytes.join('')}`
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

export function getCapabilitiesForDelegationStatus(
  delegationStatus: TradingApi.ChainDelegationMap | undefined,
  hasSmartWalletConsent: boolean,
): Record<string, Capability> {
  if (!delegationStatus) {
    return {}
  }
  const capabilities: Record<string, Capability> = {}
  for (const [chainId, delegationStatusForChain] of Object.entries(delegationStatus)) {
    let status = 'unsupported'

    // If the user has consented to smart wallets, we can use the delegation status to determine the capabilities
    if (hasSmartWalletConsent) {
      // If the wallet is delegated to Uniswap, it's supported, even if the delegation address is outdated
      if (delegationStatusForChain.isWalletDelegatedToUniswap) {
        status = 'supported'
      } else if (isFreshDelegation(delegationStatusForChain)) {
        status = 'ready'
      }
    }

    capabilities[numberToHex(parseInt(chainId, 10))] = {
      atomic: { status },
    }
  }
  return capabilities
}

/**
 * Shared core logic for handling getCapabilities requests
 * Used by both the background script and saga implementations
 */
export async function getCapabilitiesCore({
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
  let delegationStatusResponse: TradingApi.WalletCheckDelegationResponseBody | undefined

  try {
    delegationStatusResponse = await checkWalletDelegation({
      walletAddresses: [request.address],
      chainIds,
    })
  } catch (error) {
    logger.error(error, {
      tags: { file: 'batchedTransactions/utils.ts', function: 'getCapabilitiesCore' },
      extra: { request },
    })
  }

  const capabilities = getCapabilitiesForDelegationStatus(
    delegationStatusResponse?.delegationDetails[request.address],
    hasSmartWalletConsent,
  )

  return {
    type: DappResponseType.GetCapabilitiesResponse,
    requestId: request.requestId,
    response: capabilities,
  }
}
