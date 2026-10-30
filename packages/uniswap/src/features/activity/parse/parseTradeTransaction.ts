import { BigNumber } from '@ethersproject/bignumber'
import { Direction, OnChainTransaction, OnChainTransactionLabel } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { AddressStringFormat, areAddressesEqual, normalizeAddress } from '@universe/chains'
import { AssetType } from 'uniswap/src/entities/assets'
import { extractDappInfo } from 'uniswap/src/features/activity/utils/extractDappInfo'
import { AssetCase } from 'uniswap/src/features/activity/utils/remote'
import { getTokenAddressFromMintOrBurn } from 'uniswap/src/features/activity/utils/tokenTransfers'
import {
  ConfirmedSwapTransactionInfo,
  NFTTradeTransactionInfo,
  NFTTradeType,
  TransactionType,
  WithdrawTransactionInfo,
  WrapTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { DepositTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
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
 * Drops tokens the owner sends and receives in equal totals, such as a wrapper received from a pool and burned to unwrap.
 * Keeps the original transfers if that would leave either side empty.
 */
function excludeNetZeroTokenTransfers({
  sentTransfers,
  receivedTransfers,
}: {
  sentTransfers: OnChainTransaction['transfers']
  receivedTransfers: OnChainTransaction['transfers']
}): { sentTransfers: OnChainTransaction['transfers']; receivedTransfers: OnChainTransaction['transfers'] } {
  const getTokenKey = (t: OnChainTransaction['transfers'][number]): string | undefined =>
    t.asset.value?.address ? normalizeAddress(t.asset.value.address, AddressStringFormat.Lowercase) : undefined

  const sumByToken = (transfers: OnChainTransaction['transfers']): Map<string, BigNumber> => {
    const totals = new Map<string, BigNumber>()
    for (const t of transfers) {
      const tokenKey = getTokenKey(t)
      if (tokenKey) {
        totals.set(tokenKey, (totals.get(tokenKey) ?? BigNumber.from(0)).add(BigNumber.from(t.amount?.raw ?? '0')))
      }
    }
    return totals
  }

  const sentTotals = sumByToken(sentTransfers)
  const receivedTotals = sumByToken(receivedTransfers)
  const netZeroTokenKeys = new Set(
    [...receivedTotals].filter(([tokenKey, received]) => sentTotals.get(tokenKey)?.eq(received)).map(([key]) => key),
  )

  if (netZeroTokenKeys.size === 0) {
    return { sentTransfers, receivedTransfers }
  }

  const isNotNetZero = (t: OnChainTransaction['transfers'][number]): boolean => {
    const tokenKey = getTokenKey(t)
    return tokenKey === undefined || !netZeroTokenKeys.has(tokenKey)
  }
  const netSentTransfers = sentTransfers.filter(isNotNetZero)
  const netReceivedTransfers = receivedTransfers.filter(isNotNetZero)

  if (netSentTransfers.length === 0 || netReceivedTransfers.length === 0) {
    return { sentTransfers, receivedTransfers }
  }

  return { sentTransfers: netSentTransfers, receivedTransfers: netReceivedTransfers }
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
 * Parse an NFT buy/sell from the REST API. NFT purchases come through labeled as SWAP,
 * so this must be checked before falling back to the fungible swap parser.
 */
export function parseNFTTradeTransaction(transaction: OnChainTransaction): NFTTradeTransactionInfo | undefined {
  const { transfers, chainId } = transaction

  const nftTransfer = transfers.find((t) => t.asset.case === AssetCase.Nft)
  if (nftTransfer?.asset.case !== AssetCase.Nft) {
    return undefined
  }

  const nftAsset = nftTransfer.asset.value
  const { tokenId, address } = nftAsset
  if (!tokenId || !address) {
    return undefined
  }

  const tradeType = nftTransfer.direction === Direction.RECEIVE ? NFTTradeType.BUY : NFTTradeType.SELL

  // The payment token moves in the opposite direction of the NFT
  const paymentDirection = tradeType === NFTTradeType.BUY ? Direction.SEND : Direction.RECEIVE
  const paymentTransfers = transfers.filter((t) => t.direction === paymentDirection)
  const paymentTransfer = paymentTransfers.find((t) => t.asset.case === AssetCase.Token && t.asset.value.address)
  if (paymentTransfer?.asset.case !== AssetCase.Token) {
    return undefined
  }

  const paymentTokenAddress = paymentTransfer.asset.value.address
  if (!paymentTokenAddress) {
    return undefined
  }

  return {
    type: TransactionType.NFTTrade,
    tradeType,
    nftSummaryInfo: {
      name: nftAsset.name,
      collectionName: nftAsset.collectionName,
      imageURL: nftAsset.imageUrl,
      tokenId,
      address,
    },
    purchaseCurrencyId: buildCurrencyId(chainId, paymentTokenAddress),
    purchaseCurrencyAmountRaw: getTotalAmountForToken(paymentTransfers, paymentTokenAddress).toString(),
    isSpam: nftAsset.isSpam,
    dappInfo: extractDappInfo(transaction),
  }
}

/**
 * Picks the sent and received tokens that represent the swap, or undefined if either side has no usable transfer
 */
function findPrimarySwapLegs({
  sentTransfers,
  receivedTransfers,
}: {
  sentTransfers: OnChainTransaction['transfers']
  receivedTransfers: OnChainTransaction['transfers']
}):
  | {
      primarySent: { tokenAddress: string; amount: BigNumber }
      primaryReceived: { tokenAddress: string; amount: BigNumber }
    }
  | undefined {
  const primarySent = findPrimaryTokenAndAmount(sentTransfers)
  if (!primarySent) {
    return undefined
  }
  const primaryReceived = findPrimaryTokenAndAmount(receivedTransfers, primarySent.tokenAddress)
  if (!primaryReceived) {
    return undefined
  }
  return { primarySent, primaryReceived }
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

  const netTransfers = excludeNetZeroTokenTransfers({
    sentTransfers: filteredSentTransfers,
    receivedTransfers: filteredReceivedTransfers,
  })

  // Netting can leave a side whose only remaining transfers are refunds or self-transfers, so fall back to the full lists
  const primaryLegs =
    findPrimarySwapLegs(netTransfers) ??
    findPrimarySwapLegs({ sentTransfers: filteredSentTransfers, receivedTransfers: filteredReceivedTransfers })
  if (!primaryLegs) {
    return undefined
  }
  const { primarySent, primaryReceived } = primaryLegs

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
