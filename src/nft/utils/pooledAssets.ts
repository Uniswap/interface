import { BigNumber } from '@ethersproject/bignumber'
import { BagItem, BagItemStatus, GenieAsset, isPooledMarket, Markets } from 'nft/types'
import { isInSameMarketplaceCollection, isInSameSudoSwapPool } from 'nft/utils'

const PRECISION = '1000000000000000000'
const PROTOCOL_FEE_MULTIPLIER = BigNumber.from('5000000000000000')

enum BondingCurve {
  Linear = 'LINEAR',
  Exponential = 'EXPONENTIAL',
  Xyk = 'XYK',
}

interface Pool {
  delta?: string
  spotPrice?: string
  fee?: string
  bondingCurve?: BondingCurve
}

const getPoolParameters = (protocolParameters: Record<string, unknown>): Pool => {
  return {
    delta: protocolParameters?.delta ? (protocolParameters.delta as string) : undefined,
    fee: protocolParameters?.ammFeeFixed ? (protocolParameters.ammFeeFixed as string) : undefined,
    spotPrice: (protocolParameters as Record<string, { spotPrice?: string }>)?.poolMetadata?.spotPrice,
    bondingCurve: (protocolParameters as Record<string, { bondingCurve?: BondingCurve }>)?.poolMetadata?.bondingCurve,
  }
}

const calculateScaledPrice = (currentPrice: BigNumber, poolFee: BigNumber): BigNumber => {
  const protocolFee = currentPrice.mul(PROTOCOL_FEE_MULTIPLIER).div(BigNumber.from(PRECISION))
  const tradeFee = currentPrice.mul(poolFee).div(BigNumber.from(PRECISION))
  return currentPrice.add(protocolFee).add(tradeFee)
}

const calcSudoSwapLinearBondingCurve = (currentPrice: BigNumber, delta: BigNumber, position = 0): BigNumber => {
  for (let i = 0; i <= position; i++) {
    currentPrice = currentPrice.add(delta)
  }

  return currentPrice
}

const calcSudoSwapExponentialBondingCurve = (currentPrice: BigNumber, delta: BigNumber, position = 0): BigNumber => {
  for (let i = 0; i <= position; i++) {
    currentPrice = currentPrice.mul(delta).div(BigNumber.from(PRECISION))
  }

  return currentPrice
}

const calcSudoSwapXykBondingCurve = (
  currentPrice: BigNumber,
  sudoSwapPool: Pool,
  position = 0
): BigNumber | undefined => {
  let virtualTokenBalance = BigNumber.from(sudoSwapPool.spotPrice)
  let virtualNFTBalance = BigNumber.from(sudoSwapPool.delta)

  if (virtualNFTBalance.sub(BigNumber.from(1)).gt(BigNumber.from(0))) {
    currentPrice = virtualTokenBalance.div(virtualNFTBalance.sub(BigNumber.from(1)))
  } else {
    return undefined
  }

  for (let i = 1; i <= position; i++) {
    virtualTokenBalance = virtualTokenBalance.add(currentPrice)
    virtualNFTBalance = virtualNFTBalance.sub(BigNumber.from(1))

    if (!virtualNFTBalance.sub(BigNumber.from(1)).isZero()) {
      currentPrice = virtualTokenBalance.div(virtualNFTBalance.sub(BigNumber.from(1)))
    } else {
      return undefined
    }
  }

  return currentPrice
}

export const calcSudoSwapPrice = (asset: GenieAsset, position = 0): string | undefined => {
  if (!asset.sellorders) return undefined

  const sudoSwapParameters = asset.sellorders[0].protocolParameters
  const sudoSwapPool = getPoolParameters(sudoSwapParameters)

  if (!sudoSwapPool.fee || !sudoSwapPool.delta || !sudoSwapPool.spotPrice || !sudoSwapPool.bondingCurve)
    return undefined

  let currentPrice = BigNumber.from(sudoSwapPool.spotPrice)
  const delta = BigNumber.from(sudoSwapPool.delta)
  const poolFee = BigNumber.from(sudoSwapPool.fee)

  if (sudoSwapPool.bondingCurve === BondingCurve.Linear) {
    currentPrice = calcSudoSwapLinearBondingCurve(currentPrice, delta, position)
  } else if (sudoSwapPool.bondingCurve === BondingCurve.Exponential) {
    currentPrice = calcSudoSwapExponentialBondingCurve(currentPrice, delta, position)
  } else if (sudoSwapPool.bondingCurve === BondingCurve.Xyk) {
    const xykCurrentPrice = calcSudoSwapXykBondingCurve(currentPrice, sudoSwapPool, position)
    if (xykCurrentPrice) {
      currentPrice = xykCurrentPrice
    } else {
      return undefined
    }
  } else {
    return undefined
  }

  return calculateScaledPrice(currentPrice, poolFee).toString()
}

const calcAmmBasedPoolprice = (asset: GenieAsset, position = 0): string => {
  if (!asset.sellorders) return ''

  let amountToBuy: BigNumber = BigNumber.from(0)
  let marginalBuy: BigNumber = BigNumber.from(0)

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

export const calcPoolPrice = (asset: GenieAsset, position = 0): string => {
  if (!asset.sellorders) return ''
  if (asset.marketplace === Markets.Sudoswap) return calcSudoSwapPrice(asset, position) ?? '0'
  return calcAmmBasedPoolprice(asset, position)
}

export const calcAvgGroupPoolPrice = (asset: GenieAsset, numberOfAssets: number) => {
  let total = BigNumber.from(0)

  for (let i = 0; i < numberOfAssets; i++) {
    if (asset.marketplace === Markets.Sudoswap) {
      total = total.add(BigNumber.from(calcSudoSwapPrice(asset, i) ?? '0'))
    } else {
      total = total.add(BigNumber.from(calcPoolPrice(asset, i)))
    }
  }

  return total.div(numberOfAssets).toString()
}

const recalculatePooledAssetPrice = (asset: GenieAsset, position: number): string => {
  return asset.marketplace === Markets.Sudoswap
    ? calcSudoSwapPrice(asset, position) ?? ''
    : calcPoolPrice(asset, position)
}

export const recalculateBagUsingPooledAssets = (uncheckedItemsInBag: BagItem[]) => {
  if (
    !uncheckedItemsInBag.some((item) => item.asset.marketplace && isPooledMarket(item.asset.marketplace)) ||
    uncheckedItemsInBag.every(
      (item) => item.status === BagItemStatus.REVIEWED || item.status === BagItemStatus.REVIEWING_PRICE_CHANGE
    )
  )
    return uncheckedItemsInBag

  const itemsInBag = [...uncheckedItemsInBag]
  itemsInBag.forEach((item) => {
    if (item.asset.marketplace)
      if (isPooledMarket(item.asset.marketplace)) {
        const asset = item.asset
        const isPriceChangedAsset = !!asset.updatedPriceInfo

        const itemsInPool =
          asset.marketplace === Markets.Sudoswap
            ? itemsInBag.filter((bagItem) => isInSameSudoSwapPool(item.asset, bagItem.asset))
            : itemsInBag.filter((bagItem) => isInSameMarketplaceCollection(item.asset, bagItem.asset))
        const calculatedPrice = isPriceChangedAsset
          ? calcAvgGroupPoolPrice(asset, itemsInPool.length)
          : recalculatePooledAssetPrice(
              asset,
              itemsInPool.findIndex((itemInPool) => itemInPool.asset.tokenId === asset.tokenId)
            )

        if (isPriceChangedAsset && item.asset.updatedPriceInfo)
          item.asset.updatedPriceInfo.ETHPrice = item.asset.updatedPriceInfo.basePrice = calculatedPrice
        else item.asset.priceInfo.ETHPrice = calculatedPrice
      }
  })

  return itemsInBag
}
