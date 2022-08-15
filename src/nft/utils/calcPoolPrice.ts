import { BigNumber } from '@ethersproject/bignumber'

import { GenieAsset, Markets } from '../types'

export const calcPoolPrice = (asset: GenieAsset, position = 0) => {
  let amountToBuy: BigNumber = BigNumber.from(0)
  let marginalBuy: BigNumber = BigNumber.from(0)
  const nft = asset.sellorders[0]
  const decimals = BigNumber.from(1).mul(10).pow(18)
  const ammFee = nft.ammFeePercent ? (100 + nft.ammFeePercent) * 100 : 110 * 100

  if (asset.marketplace === Markets.NFTX) {
    const sixteenmul = BigNumber.from(1).mul(10).pow(16)
    amountToBuy = BigNumber.from(ammFee)
      .div(100)
      .mul(position + 1)
    amountToBuy = amountToBuy.mul(sixteenmul)

    marginalBuy = BigNumber.from(ammFee).div(100).mul(position)
    marginalBuy = marginalBuy.mul(sixteenmul)
  }
  if (asset.marketplace === Markets.NFT20) {
    amountToBuy = BigNumber.from(100).mul(position + 1)
    amountToBuy = amountToBuy.mul(decimals)

    marginalBuy = BigNumber.from(100).mul(position)
    marginalBuy = marginalBuy.mul(decimals)
  }

  const ethReserves = BigNumber.from(nft.ethReserves?.toLocaleString('fullwide', { useGrouping: false }))
  const tokenReserves = BigNumber.from(nft.tokenReserves?.toLocaleString('fullwide', { useGrouping: false }))
  const numerator = ethReserves.mul(amountToBuy).mul(1000)
  const denominator = tokenReserves.sub(amountToBuy).mul(997)

  const marginalnumerator = ethReserves.mul(marginalBuy).mul(1000)
  const marginaldenominator = tokenReserves.sub(marginalBuy).mul(997)

  let price = numerator.div(denominator)
  const marginalprice = marginalnumerator.div(marginaldenominator)

  price = price.sub(marginalprice)
  price = price.mul(101).div(100)

  return price.toString()
}
