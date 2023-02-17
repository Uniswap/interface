import { BigNumber } from '@ethersproject/bignumber'
import { formatEther } from '@ethersproject/units'
import { TxResponse, UpdatedGenieAsset } from 'nft/types'
import { getTotalNftValue } from 'nft/utils'

export const parseTransactionResponse = (transactionResponse: TxResponse | undefined, ethPrice: number) => {
  let nftsPurchased: UpdatedGenieAsset[] = []
  let nftsNotPurchased: UpdatedGenieAsset[] = []
  let showPurchasedModal = false
  let showRefundModal = false
  let totalPurchaseValue = BigNumber.from(0)
  let totalRefundValue = BigNumber.from(0)
  let totalUSDRefund = 0
  let txFeeFiat = 0

  if (transactionResponse !== undefined) {
    const { nftsPurchased: purchasedNfts, nftsNotPurchased: notPurchasedNfts, txReceipt } = transactionResponse
    if (nftsPurchased && nftsNotPurchased && txReceipt) {
      nftsPurchased = purchasedNfts
      nftsNotPurchased = notPurchasedNfts
      showPurchasedModal = nftsPurchased.length >= 1
      showRefundModal = nftsNotPurchased.length >= 1
      totalPurchaseValue = getTotalNftValue(nftsPurchased)
      totalRefundValue = getTotalNftValue(nftsNotPurchased)
      totalUSDRefund = totalRefundValue && parseFloat(formatEther(totalRefundValue)) * ethPrice
      const txFee = BigNumber.from(txReceipt ? txReceipt.gasUsed : 0).mul(
        BigNumber.from(txReceipt ? txReceipt.effectiveGasPrice : 0)
      )
      txFeeFiat = parseFloat(formatEther(txFee)) * ethPrice
    }
  }

  return {
    nftsPurchased,
    nftsNotPurchased,
    showPurchasedModal,
    showRefundModal,
    totalPurchaseValue,
    totalRefundValue,
    totalUSDRefund,
    txFeeFiat,
  }
}

// Given the length of the array of successfully purchased NFTs, returns the maxHeight and maxWidth of each asset preview
export const getSuccessfulImageSize = (numSuccessful: number, isMobile: boolean) => {
  const sizeModifier = isMobile ? 2 : 1
  if (numSuccessful === 1) {
    return 474 / sizeModifier
  } else if (numSuccessful === 2) {
    return 280 / sizeModifier
  } else if (numSuccessful === 3 || (numSuccessful >= 5 && numSuccessful < 7)) {
    return 184 / sizeModifier
  } else if (numSuccessful === 4 || (numSuccessful >= 7 && numSuccessful < 13)) {
    return 136 / sizeModifier
  } else if (numSuccessful >= 13 && numSuccessful < 21) {
    return 108 / sizeModifier
  } else return isMobile ? 39 : 64
}
