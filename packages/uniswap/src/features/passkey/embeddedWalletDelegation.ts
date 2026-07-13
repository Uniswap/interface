import { TradingApi } from '@universe/api'
import { HexString, isValidHexString } from '@universe/encoding'
import { checkWalletDelegation, TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { fetchGasFeeQuery } from 'uniswap/src/data/apiClients/uniswapApi/useGasFeeQuery'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { applyGasBuffer, getIsStatsigReady } from 'uniswap/src/features/gas/utils'
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
 * Pure derivation of embedded-wallet delegation status from Trading API delegation
 * details for a single address/chain. Shared by the execution path
 * (`checkEmbeddedWalletDelegation`) and the web swap-review delegation source
 * (`useGetSwapDelegationInfo`) so the displayed routing/gas matches what executes.
 *
 * Returns null when delegation is not applicable: no details, a non-Uniswap
 * delegation, or a needed delegation with no target contract address.
 */
export function deriveEmbeddedWalletDelegationResult(
  details: TradingApi.DelegationDetails | undefined,
): DelegationResult | null {
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
    !!details.isWalletDelegatedToUniswap &&
    !!details.latestDelegationAddress &&
    details.latestDelegationAddress !== details.currentDelegationAddress
  const contractAddress = details.latestDelegationAddress
  const needsDelegation = isFresh || isUpgrade
  if (needsDelegation) {
    if (!contractAddress) {
      // Delegation indicated but no target address — treat as not applicable.
      return null
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
    return deriveEmbeddedWalletDelegationResult(response.delegationDetails[address]?.[chainId])
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

  // `originalTx` is the source of truth for tx-level fields (nonce, gas, fees) —
  // those apply to the outer EIP-7702 transaction, not per-call. The full
  // `transactions` array maps into the inner `calls` payload so Calibur's
  // `execute(Call[])` runs them atomically as a single multicall.
  const contractAddress = getAddress(delegationResult.contractAddress)
  const { encoded } = await TradingApiClient.fetchWalletEncoding7702({
    calls: transactions.map((tx) => ({
      from: account.address,
      to: tx.to ?? '',
      data: tx.data || '0x',
      value: tx.value ?? '0x0',
      chainId: Number(chainId),
    })),
    smartContractDelegationAddress: contractAddress,
    walletAddress: account.address,
  })

  if (!encoded.data || !isValidHexString(encoded.data)) {
    throw new Error('Encoded data is not a valid hex string')
  }
  const encodedData: HexString = encoded.data
  const encodedValue = BigInt(encoded.value)
  // encode_7702 returns calldata only (no gas fields today), so gas/fees are resolved below.
  // This guard stays forward-compatible: if the encoder ever returns padded gas, skip the
  // client-side fee estimate and reuse those values.
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
    // Gas resolution:
    //  1. If encode_7702 ever returns a gasLimit, use it directly — a forward-compatible
    //     guard. Today the encoder returns calldata only, so this branch is inert.
    //  2. Otherwise estimate via the gas service with the delegation contract passed as
    //     `smartContractDelegationAddress` — the same path the in-wallet wallet_sendCalls /
    //     WalletConnect delegation flow uses. The gas service applies a state override that
    //     simulates the account as delegated (and adds its own first-delegation buffer),
    //     replacing the old client-side self-call estimate + hardcoded delegation surcharge,
    //     which risked double-counting delegation gas and under-estimated the undelegated case.
    let gas: bigint
    // Default to the fees resolved above; the gas service may return more accurate ones.
    let signedMaxFeePerGas = maxFeePerGas
    let signedMaxPriorityFeePerGas = maxPriorityFeePerGas

    if (encoded.gasLimit) {
      gas = BigInt(encoded.gasLimit)
    } else {
      const gasFeeResult = await fetchGasFeeQuery({
        tx: {
          from: account.address,
          to: account.address,
          data: encodedData,
          value: encodedValue.toString(),
          chainId: numericChainId,
        },
        smartContractDelegationAddress: contractAddress,
        isStatsigReady: getIsStatsigReady(),
      })
      const gasFeeParams = gasFeeResult.params
      if (gasFeeParams?.gasLimit) {
        // The gas service already applies strategy-based limit inflation, so no client buffer.
        gas = BigInt(gasFeeParams.gasLimit)
        if ('maxFeePerGas' in gasFeeParams) {
          signedMaxFeePerGas = BigInt(gasFeeParams.maxFeePerGas)
          signedMaxPriorityFeePerGas = BigInt(gasFeeParams.maxPriorityFeePerGas)
        }
      } else {
        // Gas service returned no gas params (estimation failed) — fall back to a
        // best-effort buffered client estimate so the swap can still proceed.
        const baseGas = originalTx.gas
          ? BigInt(originalTx.gas)
          : await publicClient.estimateGas({
              account: account.address,
              to: account.address,
              data: encodedData,
              value: encodedValue,
            })
        gas = applyGasBuffer(baseGas)
      }
    }

    const signedTxHex = await sign7702TransactionWithPasskey({
      to: account.address,
      data: encodedData,
      value: encodedValue.toString(),
      chainId: numericChainId,
      gas: gas.toString(),
      maxFeePerGas: signedMaxFeePerGas.toString(),
      maxPriorityFeePerGas: signedMaxPriorityFeePerGas.toString(),
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
  // No gas-service state override is needed here: the account IS delegated on-chain, so a
  // client-side estimateGas already runs against the delegation contract code and captures
  // execution cost accurately (buffered for headroom).
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
