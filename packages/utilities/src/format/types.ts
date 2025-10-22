export enum NumberType {
  // used for token quantities in non-transaction contexts (e.g. portfolio balances)
  TokenNonTx = 'token-non-tx',

  // used for token quantities in transaction contexts (e.g. swap, send)
  TokenTx = 'token-tx',

  // used for token quantities in chart contexts (e.g. pool stats)
  TokenQuantityStats = 'token-quantity-stats',

  // this formatter is used for displaying swap price conversions
  // below the input/output amounts
  SwapPrice = 'swap-price',

  // this formatter is only used for displaying the swap trade output amount
  // in the text input boxes. Output amounts on review screen should use the above TokenTx formatter
  SwapTradeAmount = 'swap-trade-amount',

  // fiat number that uses standard formatting without any specific rules
  FiatStandard = 'fiat-standard',

  // fiat prices in any component that belongs in the Token Details flow (except for token stats)
  FiatTokenDetails = 'fiat-token-details',

  // fiat prices everywhere except Token Details flow
  FiatTokenPrice = 'fiat-token-price',

  // fiat values for market cap, TVL, volume in the Token Details screen
  FiatTokenStats = 'fiat-token-stats',

  // fiat price of token balances
  FiatTokenQuantity = 'fiat-token-quantity',

  // fiat gas prices
  FiatGasPrice = 'fiat-gas-price',

  // fiat rewards
  FiatRewards = 'fiat-rewards',

  // portfolio balance
  PortfolioBalance = 'portfolio-balance',

  // nft floor price denominated in a token (e.g, ETH)
  NFTTokenFloorPrice = 'nft-token-floor-price',

  // nft collection stats like number of items, holder, and sales
  NFTCollectionStats = 'nft-collection-stats',

  Percentage = 'percentage',
  PercentageOneDecimal = 'percentage-one-decimal',
  PercentageThreeDecimals = 'percentage-three-decimals',
  PercentageFourDecimals = 'percentage-four-decimals',
}
export type FiatNumberType = Extract<
  NumberType,
  | NumberType.FiatTokenPrice
  | NumberType.FiatTokenDetails
  | NumberType.FiatTokenStats
  | NumberType.FiatTokenQuantity
  | NumberType.FiatGasPrice
  | NumberType.FiatRewards
  | NumberType.PortfolioBalance
  | NumberType.FiatStandard
>

export type PercentNumberDecimals = 1 | 2 | 3 | 4
export type PercentNumberType = Extract<
  NumberType,
  | NumberType.Percentage
  | NumberType.PercentageOneDecimal
  | NumberType.PercentageThreeDecimals
  | NumberType.PercentageFourDecimals
>
