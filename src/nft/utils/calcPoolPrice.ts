import { BigNumber } from '@ethersproject/bignumber'
import { BagItem, BagItemStatus, GenieAsset, Markets, UpdatedGenieAsset } from 'nft/types'

// TODO: a lot of the below typecasting logic can be simplified when GraphQL migration is complete
export const calcPoolPrice = (asset: GenieAsset, position = 0) => {
  let amountToBuy: BigNumber = BigNumber.from(0)
  let marginalBuy: BigNumber = BigNumber.from(0)
  if (!asset.sellorders) return ''

  const nft = asset.sellorders[0].protocolParameters
  const decimals = BigNumber.from(1).mul(10).pow(18)
  const ammFee = nft?.ammFeePercent ? (100 + (nft.ammFeePercent as number)) * 100 : 110 * 100

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

  const ethReserves = BigNumber.from(
    (
      nft as Record<
        string,
        {
          ethReserves: number
        }
      >
    )?.poolMetadata?.ethReserves?.toLocaleString('fullwide', { useGrouping: false }) ?? 1
  )
  const tokenReserves = BigNumber.from(
    (
      nft as Record<
        string,
        {
          tokenReserves: number
        }
      >
    )?.poolMetadata?.tokenReserves?.toLocaleString('fullwide', { useGrouping: false }) ?? 1
  )
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

export const calcAvgGroupPoolPrice = (asset: GenieAsset, numberOfAssets: number) => {
  let total = BigNumber.from(0)

  for (let i = 0; i < numberOfAssets; i++) {
    const price = BigNumber.from(calcPoolPrice(asset, i))
    total = total.add(price)
  }

  return total.div(numberOfAssets).toString()
}

export const recalculateBagUsingPooledAssets = (uncheckedItemsInBag: BagItem[]) => {
  if (
    !uncheckedItemsInBag.some(
      (item) => item.asset.marketplace === Markets.NFTX || item.asset.marketplace === Markets.NFT20
    ) ||
    uncheckedItemsInBag.every(
      (item) => item.status === BagItemStatus.REVIEWED || item.status === BagItemStatus.REVIEWING_PRICE_CHANGE
    )
  )
    return uncheckedItemsInBag

  const isPooledMarket = (market: Markets) => market === Markets.NFTX || market === Markets.NFT20

  const itemsInBag = [...uncheckedItemsInBag]
  const possibleMarkets = itemsInBag.reduce((markets, item) => {
    const asset = item.asset
    const market = asset.marketplace
    if (!market || !isPooledMarket(market)) return markets

    const key = asset.address + asset.marketplace
    if (Object.keys(markets).includes(key)) {
      markets[key].push(asset.tokenId)
    } else {
      markets[key] = [asset.tokenId]
    }
    return markets
  }, {} as { [key: string]: [string] })

  const updatedPriceMarkets = itemsInBag.reduce((markets, item) => {
    const asset = item.asset
    const market = asset.marketplace
    if (!market || !asset.updatedPriceInfo || !isPooledMarket(market)) return markets

    const key = asset.address + asset.marketplace
    if (Object.keys(markets).includes(key)) {
      markets[key] = [markets[key][0] + 1, asset]
    } else {
      markets[key] = [1, asset]
    }
    return markets
  }, {} as { [key: string]: [number, UpdatedGenieAsset] })

  const calculatedAvgPoolPrices = Object.keys(updatedPriceMarkets).reduce((prices, key) => {
    prices[key] = calcAvgGroupPoolPrice(updatedPriceMarkets[key][1], updatedPriceMarkets[key][0])
    return prices
  }, {} as { [key: string]: string })

  itemsInBag.forEach((item) => {
    if (item.asset.marketplace)
      if (isPooledMarket(item.asset.marketplace)) {
        const asset = item.asset
        const isPriceChangedAsset = !!asset.updatedPriceInfo

        const calculatedPrice = isPriceChangedAsset
          ? calculatedAvgPoolPrices[asset.address + asset.marketplace]
          : calcPoolPrice(asset, possibleMarkets[asset.address + asset.marketplace].indexOf(item.asset.tokenId))

        if (isPriceChangedAsset && item.asset.updatedPriceInfo)
          item.asset.updatedPriceInfo.ETHPrice = item.asset.updatedPriceInfo.basePrice = calculatedPrice
        else item.asset.priceInfo.ETHPrice = calculatedPrice
      }
  })

  return itemsInBag
}
