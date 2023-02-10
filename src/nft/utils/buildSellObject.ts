import { NftMarketplace, NftTradeInput, TokenAmountInput } from 'graphql/data/__generated__/types-and-hooks'
import { BagItem, BagItemStatus, UpdatedGenieAsset } from 'nft/types'

export const buildSellObject = (amount: string) => {
  return {
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    amount,
    decimals: 18,
    name: 'Ethereum',
    priceInfo: {
      baseAsset: 'ETH',
      basePrice: amount,
      ETHPrice: amount,
    },
    symbol: 'ETH',
    tokenId: 'ETH',
    tokenType: 'ERC20',
  }
}

export const buildNftTradeInputFromBagItems = (itemsInBag: BagItem[]): NftTradeInput[] => {
  const assetsToBuy = itemsInBag.filter((item) => item.status !== BagItemStatus.UNAVAILABLE).map((item) => item.asset)
  return buildNftTradeInput(assetsToBuy)
}

const buildNftTradeInput = (assets: UpdatedGenieAsset[]): NftTradeInput[] => {
  return assets.flatMap((asset) => {
    const { id, address, marketplace, priceInfo, tokenId, tokenType } = asset

    if (!id || !marketplace || !tokenType) return []

    const ethAmountInput: TokenAmountInput = {
      amount: priceInfo.ETHPrice,
      token: {
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        chainId: 1,
        decimals: 18,
        isNative: true,
      },
    }

    return [
      {
        amount: 1,
        contractAddress: address,
        id,
        marketplace: marketplace.toUpperCase() as NftMarketplace,
        quotePrice: ethAmountInput,
        tokenId,
        tokenType,
      },
    ]
  })
}
