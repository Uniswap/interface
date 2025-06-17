import { ChainDelegationMap } from 'uniswap/src/data/tradingApi/__generated__'
import { TransactionRequest } from 'uniswap/src/data/tradingApi/__generated__/models/TransactionRequest'
import { EthTransaction } from 'uniswap/src/types/walletConnect'
import { numberToHex } from 'uniswap/src/utils/hex'
import { Capability } from 'wallet/src/features/dappRequests/types'

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
}): TransactionRequest[] {
  return calls
    .map((call): TransactionRequest | undefined => {
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
    .filter((call): call is TransactionRequest => !!call)
}

export function getCapabilitiesForDelegationStatus(
  delegationStatus: ChainDelegationMap | undefined,
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
      }

      // TODO (WALL-6861): Bring back 'ready' status for fresh delegations once we have a way to bundle delegations on external transactions
    }

    capabilities[numberToHex(parseInt(chainId, 10))] = {
      atomic: { status },
    }
  }
  return capabilities
}
