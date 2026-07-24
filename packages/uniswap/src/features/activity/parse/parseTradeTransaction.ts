import { BigNumber } from '@ethersproject/bignumber'
import { Direction, OnChainTransaction, OnChainTransactionLabel } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { AssetType } from 'uniswap/src/entities/assets'
import { extractDappInfo } from 'uniswap/src/features/activity/utils/extractDappInfo'
import { AssetCase } from 'uniswap/src/features/activity/utils/remote'
import { getTokenAddressFromMintOrBurn } from 'uniswap/src/features/activity/utils/tokenTransfers'
import {
  ConfirmedSwapTransactionInfo,
  TransactionType,
  WithdrawTransactionInfo,
  WrapTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { DepositTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

interface TokenMovementParseOptions {
  isVault?: boolean
}

/**
 * Type guard to validate transactedValue structure from REST API
 */
function isTransactedValueResponse(value: unknown): value is { currency: string; value: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'currency' in value &&
    'value' in value &&
    typeof (value as { currency?: unknown }).currency === 'string' &&
    typeof (value as { value?: unknown }).value === 'number'
  )
}

/**
 * Helper function to calculate total amount for a specific token
 */
function getTotalAmountForToken(transfers: OnChainTransaction['transfers'], tokenAddress: string): BigNumber {
  return transfers
    .filter((t) => t.asset.value?.address === tokenAddress)
    .reduce((sum, t) => sum.add(BigNumber.from(t.amount?.raw ?? '0')), BigNumber.from(0))
}

/**
 * Filters out FOT (Fee-on-Transfer) fee transfers that don't go to/from the owner.
 * FOT tokens cause Zerion to return multiple transfers - one for the actual amount
 * (to/from the owner) and one for the fee (to a different address).
 */
function excludeFOTFeeTransfers(
  transfers: OnChainTransaction['transfers'],
  { ownerAddress, chainId, direction }: { ownerAddress: string; chainId: number; direction: 'sent' | 'received' },
): OnChainTransaction['transfers'] {
  return transfers.filter((t) => {
    // Only filter FOT tokens
    if (t.asset.case !== 'token' || !t.asset.value.metadata?.feeData?.feeDetector?.feeTakenOnTransfer) {
      return true
    }
    // For FOT tokens, only keep transfers to/from the owner
    const addressToCheck = direction === 'received' ? t.to : t.from
    return areAddressesEqual({
      addressInput1: { address: addressToCheck, chainId },
      addressInput2: { address: ownerAddress, chainId },
    })
  })
}

/**
 * Helper function to find the primary token transfer, filtering out refunds and fees
 */
function findPrimaryTokenAndAmount(
  transfers: OnChainTransaction['transfers'],
  filterAddress?: string,
): { tokenAddress: string; amount: BigNumber } | undefined {
  // Filter out potential refunds and internal transfers
  const filteredTransfers = transfers.filter((t) => {
    if (!t.asset.value?.address || (filterAddress && t.asset.value.address === filterAddress)) {
      return false
    }

    if (t.from === t.to) {
      return false
    }

    return true
  })

  const tokenAddress = filteredTransfers[0]?.asset.value?.address

  if (!tokenAddress) {
    return undefined
  }

  return {
    tokenAddress,
    amount: getTotalAmountForToken(filteredTransfers, tokenAddress),
  }
}

/**
 * Parse a swap or on-chain uniswapX transaction from the REST API
 */
export function parseSwapTransaction(transaction: OnChainTransaction): ConfirmedSwapTransactionInfo | undefined {
  const { transfers, chainId, from: ownerAddress } = transaction
  if (transfers.length < 2) {
    return undefined
  }

  const sentTransfers = transfers.filter((t) => t.direction === Direction.SEND && t.asset.value?.address)
  const receivedTransfers = transfers.filter((t) => t.direction === Direction.RECEIVE && t.asset.value?.address)

  if (sentTransfers.length === 0 || receivedTransfers.length === 0) {
    return undefined
  }

  // Filter out FOT fee transfers before finding primary amounts
  const filteredSentTransfers = excludeFOTFeeTransfers(sentTransfers, {
    ownerAddress,
    chainId,
    direction: 'sent',
  })
  const filteredReceivedTransfers = excludeFOTFeeTransfers(receivedTransfers, {
    ownerAddress,
    chainId,
    direction: 'received',
  })

  const primarySent = findPrimaryTokenAndAmount(filteredSentTransfers)
  if (!primarySent) {
    return undefined
  }

  const primaryReceived = findPrimaryTokenAndAmount(filteredReceivedTransfers, primarySent.tokenAddress)
  if (!primaryReceived) {
    return undefined
  }

  // Try to parse transactedValue from the sent transfer if available
  // Note: REST API transfers may not have transactedValue, but we check for it
  let transactedUSDValue: number | undefined
  const primarySentTransfer = sentTransfers.find((t) => t.asset.value?.address === primarySent.tokenAddress)
  // @ts-expect-error - transactedValue may not be in type definition but could exist at runtime
  const tv = primarySentTransfer?.transactedValue
  if (isTransactedValueResponse(tv) && tv.currency === 'USD') {
    transactedUSDValue = tv.value
  }

  return {
    type: TransactionType.Swap,
    inputCurrencyId: buildCurrencyId(chainId, primarySent.tokenAddress),
    outputCurrencyId: buildCurrencyId(chainId, primaryReceived.tokenAddress),
    inputCurrencyAmountRaw: primarySent.amount.toString(),
    outputCurrencyAmountRaw: primaryReceived.amount.toString(),
    transactedUSDValue,
    dappInfo: extractDappInfo(transaction),
  }
}

/**
 * Parse a Wrap transaction from the REST API
 */
export function parseWrapTransaction(transaction: OnChainTransaction): WrapTransactionInfo | undefined {
  const { transfers, label } = transaction
  const firstTransfer = transfers[0]

  if (transfers.length < 2) {
    return undefined
  }

  return {
    type: TransactionType.Wrap,
    unwrapped: label === OnChainTransactionLabel.UNWRAP,
    currencyAmountRaw: firstTransfer?.amount?.raw ?? '',
    dappInfo: extractDappInfo(transaction),
  }
}

/** Parse a REST deposit transaction from the sent token transfer. */
export function parseDepositTransaction(
  transaction: OnChainTransaction,
  options: TokenMovementParseOptions = {},
): DepositTransactionInfo | undefined {
  const sendTransfer = transaction.transfers.find(
    (t) => t.direction === Direction.SEND && t.asset.case === AssetCase.Token,
  )

  const tokenAddress = sendTransfer?.asset.value?.address
  if (!tokenAddress) {
    return undefined
  }

  const vaultAddress = options.isVault
    ? getTokenAddressFromMintOrBurn({ transaction, direction: Direction.RECEIVE })
    : undefined

  return {
    type: TransactionType.Deposit,
    assetType: AssetType.Currency,
    tokenAddress,
    currencyAmountRaw: sendTransfer.amount?.raw,
    ...(options.isVault ? { isVault: true } : {}),
    ...(vaultAddress ? { vaultAddress } : {}),
    dappInfo: extractDappInfo(transaction),
  }
}

/** Parse a REST withdraw transaction from the received token transfer. */
export function parseWithdrawTransaction(
  transaction: OnChainTransaction,
  options: TokenMovementParseOptions = {},
): WithdrawTransactionInfo | undefined {
  const receiveTransfer = transaction.transfers.find(
    (t) => t.direction === Direction.RECEIVE && t.asset.case === AssetCase.Token,
  )

  const tokenAddress = receiveTransfer?.asset.value?.address
  if (!tokenAddress) {
    return undefined
  }

  const vaultAddress = options.isVault
    ? getTokenAddressFromMintOrBurn({ transaction, direction: Direction.SEND })
    : undefined

  return {
    type: TransactionType.Withdraw,
    assetType: AssetType.Currency,
    tokenAddress,
    currencyAmountRaw: receiveTransfer.amount?.raw,
    ...(options.isVault ? { isVault: true } : {}),
    ...(vaultAddress ? { vaultAddress } : {}),
    dappInfo: extractDappInfo(transaction),
  }
}
