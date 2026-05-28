import { HexString, isValidHexString } from '@universe/encoding'
import { checkWalletDelegation, TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SMART_WALLET_DELEGATION_GAS_FEE } from 'uniswap/src/features/gas/hooks'
import { applyGasBuffer } from 'uniswap/src/features/gas/utils'
import { sign7702AuthorizationWithPasskey, sign7702TransactionWithPasskey } from 'uniswap/src/features/passkey/signing'
import { logger } from 'utilities/src/logger/logger'
import { Account, Address, type Hash, getAddress } from 'viem'

export type DelegationResult =
  | {
      needsDelegation: true
      contractAddress: string
      currentDelegationAddress?: string
      isWalletDelegatedToUniswap?: boolean
    }
  | {
      needsDelegation: false
      contractAddress?: string
      currentDelegationAddress?: string
      isWalletDelegatedToUniswap?: boolean
    }

/**
 * Checks delegation status for an address on a given chain via the Trading API.
 * Returns null if delegation is not applicable (no details or non-Uniswap delegation).
 */
export async function checkEmbeddedWalletDelegation(
  address: Address,
  chainId: UniverseChainId,
): Promise<DelegationResult | null> {
  try {
    const response = await checkWalletDelegation({ walletAddresses: [address], chainIds: [Number(chainId)] })
    const details = response.delegationDetails[address]?.[chainId]
    if (!details) {
      return null
    }
    // Non-Uniswap delegation — skip
    if (details.currentDelegationAddress && !details.isWalletDelegatedToUniswap) {
      return null
    }
    // Fresh delegation (no current, but latest exists) or upgrade (current != latest)
    const isFresh = !details.currentDelegationAddress && !!details.latestDelegationAddress
    const isUpgrade =
      details.isWalletDelegatedToUniswap &&
      !!details.latestDelegationAddress &&
      details.latestDelegationAddress !== details.currentDelegationAddress
    const contractAddress = details.latestDelegationAddress
    const delegation = isFresh || isUpgrade
    if (delegation) {
      if (!contractAddress) {
        throw new Error('Delegation required but no contract address available')
      }
      return {
        needsDelegation: true,
        contractAddress,
        currentDelegationAddress: details.currentDelegationAddress ?? undefined,
        isWalletDelegatedToUniswap: details.isWalletDelegatedToUniswap,
      }
    }
    return {
      needsDelegation: false,
      contractAddress,
      currentDelegationAddress: details.currentDelegationAddress ?? undefined,
      isWalletDelegatedToUniswap: details.isWalletDelegatedToUniswap,
    }
  } catch (error) {
    // Intentional: return null so the caller falls back to sendStandardTransaction.
    // A transient API error shouldn't block a simple transfer — it just skips delegation.
    logger.error(error, { tags: { file: 'embeddedWalletDelegation.ts', function: 'checkEmbeddedWalletDelegation' } })
    return null
  }
}

/**
 * Sends a delegated transaction, encoding calls through the delegation contract.
 * Includes an authorizationList for fresh/upgrade delegation, or sends a standard
 * self-call if the wallet is already delegated.
 */
export type EthTransactionParams = {
  to?: string
  data?: string
  value?: string
  nonce?: number
  gas?: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
}

export async function sendDelegatedTransaction(ctx: {
  transactions: EthTransactionParams[]
  account: Account
  delegationResult: DelegationResult
  chainId: UniverseChainId
  publicClient: ReturnType<typeof import('viem').createPublicClient>
  signTransaction: NonNullable<Account['signTransaction']>
  walletId?: string
}): Promise<Hash> {
  const { transactions, account, delegationResult, chainId, publicClient, signTransaction, walletId } = ctx
  if (!delegationResult.contractAddress) {
    throw new Error('Delegation contract address is required')
  }

  const originalTx = transactions[0]
  if (!originalTx) {
    throw new Error('No transaction provided')
  }

  const contractAddress = getAddress(delegationResult.contractAddress)
  const { encoded } = await TradingApiClient.fetchWalletEncoding7702({
    calls: [
      {
        from: account.address,
        to: originalTx.to ?? '',
        data: originalTx.data || '0x',
        value: originalTx.value ?? '0',
        chainId: Number(chainId),
      },
    ],
    smartContractDelegationAddress: contractAddress,
    walletAddress: account.address,
  })

  if (!encoded.data || !isValidHexString(encoded.data)) {
    throw new Error('Encoded data is not a valid hex string')
  }
  const encodedData: HexString = encoded.data
  const encodedValue = BigInt(encoded.value)
  // Use gas values from Trading API response when available, fall back to client-side estimation
  const hasEncodedGasValues = encoded.gasLimit && encoded.maxFeePerGas && encoded.maxPriorityFeePerGas
  const [feePerGasEstimates, nonce] = await Promise.all([
    hasEncodedGasValues ? Promise.resolve(null) : publicClient.estimateFeesPerGas({ chain: getChainInfo(chainId) }),
    publicClient.getTransactionCount({ address: account.address }),
  ])

  const txNonce = originalTx.nonce ?? nonce
  const numericChainId = Number(chainId)
  const rawMaxFeePerGas = encoded.maxFeePerGas ?? originalTx.maxFeePerGas ?? feePerGasEstimates?.maxFeePerGas
  const rawMaxPriorityFeePerGas =
    encoded.maxPriorityFeePerGas ?? originalTx.maxPriorityFeePerGas ?? feePerGasEstimates?.maxPriorityFeePerGas
  if (rawMaxFeePerGas == null) {
    throw new Error('Unable to determine maxFeePerGas — all fee sources exhausted')
  }
  const maxFeePerGas = BigInt(rawMaxFeePerGas)
  // maxPriorityFeePerGas of 0 is valid on some L2s, so only throw when no source provided a value
  const maxPriorityFeePerGas = BigInt(rawMaxPriorityFeePerGas ?? 0)

  if (delegationResult.needsDelegation) {
    // EIP-7702: the authorization nonce must be the account's nonce at execution time.
    // The transaction itself consumes txNonce, so the authorization uses txNonce + 1.
    const authNonce = txNonce + 1

    // Step 1: Sign the EIP-7702 authorization
    const authResult = await sign7702AuthorizationWithPasskey({
      contractAddress: delegationResult.contractAddress,
      chainId: numericChainId,
      nonce: authNonce,
      walletId,
    })

    // Step 2: Sign the full EIP-7702 transaction (backend handles type-4 signing + serialization)
    // Gas estimation: prefer encode_7702 response (already buffered) > original swap tx gas > client-side estimate.
    // Only apply applyGasBuffer for client-side estimates — the Trading API response is already padded.
    let gas: bigint
    if (encoded.gasLimit) {
      gas = BigInt(encoded.gasLimit)
    } else if (originalTx.gas) {
      gas = applyGasBuffer(BigInt(originalTx.gas) + BigInt(SMART_WALLET_DELEGATION_GAS_FEE))
    } else {
      // WARNING: the account is not yet delegated — estimateGas will treat this as an EOA
      // self-call and likely under-estimate. Prefer providing originalTx.gas or relying
      // on the Trading API's encoded.gasLimit instead of reaching this branch.
      const baseGas = await publicClient.estimateGas({
        account: account.address,
        to: account.address,
        data: encodedData,
        value: encodedValue,
      })
      gas = applyGasBuffer(baseGas + BigInt(SMART_WALLET_DELEGATION_GAS_FEE))
    }

    const signedTxHex = await sign7702TransactionWithPasskey({
      to: account.address,
      data: encodedData,
      value: encodedValue.toString(),
      chainId: numericChainId,
      gas: gas.toString(),
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
      nonce: txNonce,
      authorization: authResult,
      walletId,
    })

    // Step 3: Submit the fully signed EIP-7702 transaction
    if (!signedTxHex || !isValidHexString(signedTxHex)) {
      throw new Error('Signed transaction is not a valid hex string')
    }
    return publicClient.sendRawTransaction({ serializedTransaction: signedTxHex as HexString })
  }

  // Already delegated — standard self-call with encoded data.
  // Unlike the needsDelegation path, we don't add SMART_WALLET_DELEGATION_GAS_FEE or check
  // originalTx.gas here: the account IS delegated, so estimateGas runs against the delegation
  // contract code and captures execution cost accurately.
  const selfCallGas = encoded.gasLimit
    ? BigInt(encoded.gasLimit)
    : applyGasBuffer(
        await publicClient.estimateGas({
          account: account.address,
          to: account.address,
          data: encodedData,
          value: encodedValue,
        }),
      )
  const tx = {
    to: account.address,
    data: encodedData,
    value: encodedValue,
    chainId: numericChainId,
    gas: selfCallGas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce: txNonce,
  }
  const signedTx = await signTransaction(tx)
  return publicClient.sendRawTransaction({ serializedTransaction: signedTx })
}
