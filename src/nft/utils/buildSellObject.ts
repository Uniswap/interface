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
