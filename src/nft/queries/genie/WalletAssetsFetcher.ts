import { BigNumber } from '@ethersproject/bignumber'
import { formatEther } from '@ethersproject/units'

import { WalletAsset } from '../../types'

const getEthPrice = (price: any) => {
  if (price.toString().includes('e')) {
    return BigNumber.from(10).pow(price.toString().split('e+')[1]).toString()
  }

  return Math.round(price).toString()
}

export const fetchWalletAssets = async ({
  ownerAddress,
  collectionAddresses,
  pageParam,
}: {
  ownerAddress: string
  collectionAddresses?: string[]
  pageParam: number
}): Promise<WalletAsset[]> => {
  const collectionAddressesString = collectionAddresses
    ? collectionAddresses.reduce((str, collectionAddress) => str + `&assetContractAddresses=${collectionAddress}`, '')
    : ''
  const url = `${
    process.env.REACT_APP_GENIE_V3_API_URL
  }/walletAssets?address=${ownerAddress}${collectionAddressesString}&limit=25&offset=${pageParam * 25}`

  const r = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  const data = await r.json()
  return data.data.assets.map((asset: any) => {
    return {
      ...asset,
      collectionIsVerified: asset.asset_contract.isVerified,
      lastPrice: asset.last_sale.total_price && formatEther(asset.last_sale.total_price),
      floorPrice: asset.collection?.floorPrice,
      creatorPercentage: parseFloat(asset.asset_contract.dev_seller_fee_basis_points) / 10000,
      date_acquired: asset.last_sale ? asset.last_sale.event_timestamp : asset.asset_contract.created_date,
      listing_date: asset.sellOrders.length
        ? Math.max
            .apply(
              null,
              asset.sellOrders.map(function (order: any) {
                return new Date(order.orderCreatedDate)
              })
            )
            .toString()
        : null,
      floor_sell_order_price: asset?.sellOrders?.length
        ? Math.min(
            ...asset.sellOrders.map((order: any) => {
              return parseFloat(formatEther(getEthPrice(order.ethPrice)))
            })
          )
        : null,
    }
  })
}
