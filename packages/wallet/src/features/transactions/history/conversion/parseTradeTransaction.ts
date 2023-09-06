// TODO(MOB-203): reduce component complexity
/* eslint-disable complexity */
import { TradeType } from '@uniswap/sdk-core'
import { fromGraphQLChain } from 'wallet/src/features/chains/utils'
import {
  deriveCurrencyAmountFromAssetResponse,
  parseUSDValueFromAssetChange,
} from 'wallet/src/features/transactions/history/utils'
import {
  ExactInputSwapTransactionInfo,
  NFTTradeTransactionInfo,
  NFTTradeType,
  TransactionListQueryResponse,
  TransactionType,
  WrapTransactionInfo,
} from 'wallet/src/features/transactions/types'
import {
  buildCurrencyId,
  buildNativeCurrencyId,
  buildWrappedNativeCurrencyId,
} from 'wallet/src/utils/currencyId'

export default function parseTradeTransaction(
  transaction: NonNullable<TransactionListQueryResponse>
): ExactInputSwapTransactionInfo | NFTTradeTransactionInfo | WrapTransactionInfo | undefined {
  // ignore UniswapX transactions for now
  if (transaction?.details?.__typename !== 'TransactionDetails') return undefined

  const chainId = fromGraphQLChain(transaction.chain)
  if (!chainId) return undefined

  // for detecting wraps
  const nativeCurrencyID = buildNativeCurrencyId(chainId).toLocaleLowerCase()
  const wrappedCurrencyID = buildWrappedNativeCurrencyId(chainId).toLocaleLowerCase()

  const sent = transaction.details.assetChanges.find((t) => {
    return (
      (t?.__typename === 'TokenTransfer' && t.direction === 'OUT') ||
      (t?.__typename === 'NftTransfer' && t.direction === 'OUT')
    )
  })
  const received = transaction.details.assetChanges.find((t) => {
    return (
      (t?.__typename === 'TokenTransfer' && t.direction === 'IN') ||
      (t?.__typename === 'NftTransfer' && t.direction === 'IN')
    )
  })

  // Invalid input/output info
  if (!sent || !received) return undefined

  const onlyERC20Tokens =
    sent.__typename === 'TokenTransfer' && received.__typename === 'TokenTransfer'
  const containsNFT = sent.__typename === 'NftTransfer' || received.__typename === 'NftTransfer'

  // TODO: [MOB-235] Currently no spec for advanced transfer types.
  if (!(onlyERC20Tokens || containsNFT)) {
    return undefined
  }

  // Token swap
  if (onlyERC20Tokens) {
    const inputCurrencyId =
      sent.tokenStandard === 'NATIVE'
        ? buildNativeCurrencyId(chainId)
        : sent.asset.address
        ? buildCurrencyId(chainId, sent.asset.address)
        : null
    const outputCurrencyId =
      received.tokenStandard === 'NATIVE'
        ? buildNativeCurrencyId(chainId)
        : received.asset.address
        ? buildCurrencyId(chainId, received.asset.address)
        : null
    const inputCurrencyAmountRaw = deriveCurrencyAmountFromAssetResponse(
      sent.tokenStandard,
      sent.asset.chain,
      sent.asset.address,
      sent.asset.decimals,
      sent.quantity
    )
    const expectedOutputCurrencyAmountRaw = deriveCurrencyAmountFromAssetResponse(
      received.tokenStandard,
      received.asset.chain,
      received.asset.address,
      received.asset.decimals,
      received.quantity
    )

    const transactedUSDValue = parseUSDValueFromAssetChange(sent.transactedValue)

    // Data API marks wrap as a swap.
    if (
      (inputCurrencyId?.toLocaleLowerCase() === nativeCurrencyID &&
        outputCurrencyId?.toLocaleLowerCase() === wrappedCurrencyID) ||
      (inputCurrencyId?.toLocaleLowerCase() === wrappedCurrencyID &&
        outputCurrencyId?.toLocaleLowerCase() === nativeCurrencyID)
    ) {
      return {
        type: TransactionType.Wrap,
        unwrapped: outputCurrencyId.toLocaleLowerCase() === nativeCurrencyID.toLocaleLowerCase(),
        currencyAmountRaw: inputCurrencyAmountRaw,
      }
    }

    if (!inputCurrencyId || !outputCurrencyId) {
      return undefined
    }
    return {
      type: TransactionType.Swap,
      tradeType: TradeType.EXACT_INPUT,
      inputCurrencyId,
      outputCurrencyId,
      transactedUSDValue,
      inputCurrencyAmountRaw,
      expectedOutputCurrencyAmountRaw,
      minimumOutputCurrencyAmountRaw: expectedOutputCurrencyAmountRaw,
    }
  }

  // NFT trade found
  if (containsNFT) {
    const nftChange = [received, sent].find((t) => t.__typename === 'NftTransfer')
    const tokenChange = [received, sent].find((t) => t.__typename === 'TokenTransfer')
    // TODO: [MOB-236] Monitor txns where we have only NFT swaps
    if (nftChange?.__typename !== 'NftTransfer' || tokenChange?.__typename !== 'TokenTransfer') {
      return undefined
    }
    const name = nftChange.asset?.name
    const collectionName = nftChange.asset?.collection?.name
    const imageURL = nftChange.asset?.image?.url
    const tokenId = nftChange.asset?.name
    const purchaseCurrencyId =
      tokenChange.tokenStandard === 'NATIVE'
        ? buildNativeCurrencyId(chainId)
        : tokenChange.asset?.address
        ? buildCurrencyId(chainId, tokenChange.asset.address)
        : undefined
    const purchaseCurrencyAmountRaw = deriveCurrencyAmountFromAssetResponse(
      tokenChange.tokenStandard,
      tokenChange.asset.chain,
      tokenChange.asset.address,
      tokenChange.asset.decimals,
      tokenChange.quantity
    )
    const tradeType = nftChange.direction === 'IN' ? NFTTradeType.BUY : NFTTradeType.SELL

    const transactedUSDValue = parseUSDValueFromAssetChange(tokenChange.transactedValue)

    if (
      !name ||
      !collectionName ||
      !imageURL ||
      !tokenId ||
      !purchaseCurrencyId ||
      !purchaseCurrencyAmountRaw
    ) {
      return undefined
    }
    return {
      type: TransactionType.NFTTrade,
      tradeType,
      nftSummaryInfo: {
        name,
        collectionName,
        imageURL,
        tokenId,
      },
      purchaseCurrencyId,
      purchaseCurrencyAmountRaw,
      transactedUSDValue,
    }
  }
}
