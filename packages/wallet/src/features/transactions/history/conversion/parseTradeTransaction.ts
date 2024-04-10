// TODO(MOB-203): reduce component complexity
/* eslint-disable complexity */
import { BigNumber } from 'ethers'
import {
  TokenStandard,
  TransactionDirection,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { fromGraphQLChain } from 'wallet/src/features/chains/utils'
import {
  deriveCurrencyAmountFromAssetResponse,
  parseUSDValueFromAssetChange,
} from 'wallet/src/features/transactions/history/utils'
import {
  ConfirmedSwapTransactionInfo,
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

type TransferAssetChange = Extract<
  NonNullable<
    Extract<
      NonNullable<TransactionListQueryResponse>['details'],
      { __typename?: 'TransactionDetails' | undefined }
    >['assetChanges']
  >[0],
  { __typename: 'TokenTransfer' | 'NftTransfer' }
>

export default function parseTradeTransaction(
  transaction: NonNullable<TransactionListQueryResponse>
): ConfirmedSwapTransactionInfo | NFTTradeTransactionInfo | WrapTransactionInfo | undefined {
  // ignore UniswapX transactions for now
  if (transaction?.details?.__typename !== 'TransactionDetails') {
    return undefined
  }

  const chainId = fromGraphQLChain(transaction.chain)
  if (!chainId) {
    return
  }

  const txAssetChanges =
    transaction.details.assetChanges?.filter(
      (t): t is TransferAssetChange =>
        t?.__typename === 'TokenTransfer' || t?.__typename === 'NftTransfer'
    ) ?? []

  // for detecting wraps
  const nativeCurrencyID = buildNativeCurrencyId(chainId).toLocaleLowerCase()
  const wrappedCurrencyID = buildWrappedNativeCurrencyId(chainId).toLocaleLowerCase()

  const sent = txAssetChanges.find((t) => t.direction === TransactionDirection.Out)

  const { received, refund } = txAssetChanges.reduce<{
    refund?: Extract<TransferAssetChange, { __typename: 'TokenTransfer' }>
    received?: TransferAssetChange
  }>(
    (acc, t) => {
      if (t.direction !== TransactionDirection.In) {
        return acc
      }

      const isRefundInternalTx =
        t?.__typename === 'TokenTransfer' &&
        t.asset.id === sent?.asset.id &&
        t.tokenStandard === TokenStandard.Native

      if (isRefundInternalTx) {
        acc.refund = t
      } else {
        acc.received = t
      }

      return acc
    },
    {
      refund: undefined,
      received: undefined,
    }
  )

  // Invalid input/output info
  if (!sent || !received) {
    return
  }

  const onlyERC20Tokens =
    sent.__typename === 'TokenTransfer' && received.__typename === 'TokenTransfer'
  const containsNFT = sent.__typename === 'NftTransfer' || received.__typename === 'NftTransfer'

  // TODO: [MOB-235] Currently no spec for advanced transfer types.
  if (!(onlyERC20Tokens || containsNFT)) {
    return
  }

  // Token swap
  if (onlyERC20Tokens) {
    const inputCurrencyId =
      sent.tokenStandard === TokenStandard.Native
        ? buildNativeCurrencyId(chainId)
        : sent.asset.address
        ? buildCurrencyId(chainId, sent.asset.address)
        : null
    const outputCurrencyId =
      received.tokenStandard === TokenStandard.Native
        ? buildNativeCurrencyId(chainId)
        : received.asset.address
        ? buildCurrencyId(chainId, received.asset.address)
        : null
    let inputCurrencyAmountRaw = deriveCurrencyAmountFromAssetResponse(
      sent.tokenStandard,
      sent.asset.chain,
      sent.asset.address,
      sent.asset.decimals,
      sent.quantity
    )

    if (refund && refund.tokenStandard === sent.tokenStandard) {
      const refundCurrencyAmountRaw = deriveCurrencyAmountFromAssetResponse(
        refund.tokenStandard,
        refund.asset.chain,
        refund.asset.address,
        refund.asset.decimals,
        refund.quantity
      )

      inputCurrencyAmountRaw = BigNumber.from(inputCurrencyAmountRaw)
        .sub(refundCurrencyAmountRaw)
        .toString()
    }

    const outputCurrencyAmountRaw = deriveCurrencyAmountFromAssetResponse(
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
      return
    }

    return {
      type: TransactionType.Swap,
      inputCurrencyId,
      outputCurrencyId,
      transactedUSDValue,
      inputCurrencyAmountRaw,
      outputCurrencyAmountRaw,
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
      tokenChange.tokenStandard === TokenStandard.Native
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
