import {
  NFTMintTransactionInfo,
  NFTTradeTransactionInfo,
  NFTTradeType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { ActivityRowFragments } from '~/pages/Portfolio/Activity/ActivityTable/activityTableModels'
import { toProtocolInfo } from '~/pages/Portfolio/Activity/ActivityTable/protocolInfo'
import { ActivityFilterType } from '~/pages/Portfolio/Activity/Filters/activityFilterTypes'

export function buildNFTMintActivityRowFragments(
  typeInfo: NFTMintTransactionInfo,
  chainId: number,
): ActivityRowFragments {
  return {
    amount: {
      kind: 'nft',
      nftImageUrl: typeInfo.nftSummaryInfo.imageURL,
      nftName: typeInfo.nftSummaryInfo.name,
      nftCollectionName: typeInfo.nftSummaryInfo.collectionName,
      purchaseCurrencyId: typeInfo.purchaseCurrencyId,
      purchaseAmountRaw: typeInfo.purchaseCurrencyAmountRaw,
    },
    counterparty: typeInfo.dappInfo?.address ? getValidAddress({ address: typeInfo.dappInfo.address, chainId }) : null,
    typeLabel: {
      baseGroup: ActivityFilterType.Mints,
      overrideLabelKey: 'transaction.status.mint.success',
    },
    protocolInfo: toProtocolInfo(typeInfo.dappInfo),
  }
}

export function buildNFTTradeActivityRowFragments(
  typeInfo: NFTTradeTransactionInfo,
  chainId: number,
): ActivityRowFragments {
  return {
    amount: {
      kind: 'nft',
      nftImageUrl: typeInfo.nftSummaryInfo.imageURL,
      nftName: typeInfo.nftSummaryInfo.name,
      nftCollectionName: typeInfo.nftSummaryInfo.collectionName,
      purchaseCurrencyId: typeInfo.purchaseCurrencyId,
      purchaseAmountRaw: typeInfo.purchaseCurrencyAmountRaw,
    },
    counterparty: typeInfo.dappInfo?.address ? getValidAddress({ address: typeInfo.dappInfo.address, chainId }) : null,
    typeLabel:
      typeInfo.tradeType === NFTTradeType.BUY
        ? { baseGroup: ActivityFilterType.Receives, overrideLabelKey: 'transaction.status.buy.success' }
        : { baseGroup: ActivityFilterType.Sends, overrideLabelKey: 'transaction.status.sell.success' },
    protocolInfo: toProtocolInfo(typeInfo.dappInfo),
  }
}
