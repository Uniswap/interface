/**
 * This file contains typings for Covalent return types.
 * The data api slice transforms from these Covalent types
 * to app types (./types.ts) to abstract away the data source.
 *
 * https://www.covalenthq.com/docs/api/
 */

export type CovalentWalletBalanceItem = {
  // The asset balance. Use contract_decimals to scale this balance for display purposes.
  balance: number
  // The asset balance 24 hours ago.
  balance_24h: number
  // Smart contract address.
  contract_address: string
  // Smart contract decimals.
  contract_decimals: number
  // Smart contract name.
  contract_name: string
  // Smart contract ticker symbol.
  contract_ticker_symbol: string
  // Last transferred date for a wallet
  last_transferred_at: string
  // Smart contract URL.
  logo_url: string
  // Array of NFTs that are held under this contract.
  nft_data: unknown[]
  // Array of NFTs that are held under this contract.
  INFTMetadata: unknown[]
  // The current balance converted to fiat in quote-currency.
  quote: number
  // The current balance converted to fiat in quote-currency as of 24 hours ago.
  quote_24h: number
  // The current spot exchange rate in quote-currency.
  quote_rate: number
  // The spot exchange rate in quote-currency as of 24 hours ago.
  quote_rate_24h: number
  // The standard interface(s) supported for this token, eg: ERC-20.
  supports_erc: string[]
  // One of cryptocurrency, stablecoin, nft or dust.
  type: 'cryptocurrency' | 'stablecoin' | 'nft' | 'dust'
}

export type CovalentBalances = {
  //The requested wallet address.
  address: string
  items: CovalentWalletBalanceItem[]
  // The next updated time.
  next_update_at: string
  // The requested fiat currency.
  quote_currency: string
  // The updated time.
  updated_at: string
}

export type CovalentSpotPrices = {
  items: CovalentTickerPriceItemWithRank[]
}

export type CovalentTickerPriceItemWithRank = {
  // Smart contract address.
  contract_address: string
  // Smart contract decimals.
  contract_decimals: number | number
  // Smart contract name.
  contract_name: string
  // Smart contract ticker symbol.
  contract_ticker_symbol: string
  // Smart contract URL.
  logo_url: string
  // The current spot exchange rate in quote-currency.
  quote_rate: number | number
  // Market cap rank.
  rank: number | number
  supports_erc: string[] // The standard interface(s) supported for this token, eg: ERC-20.
}
