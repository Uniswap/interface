import { type Currency, type Token } from '@uniswap/sdk-core'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { zeroAddress } from '~/chains'
import { RaiseCurrency } from '~/pages/Liquidity/CreateAuction/types'

/**
 * The chain's primary stablecoin (the stablecoin an auction raises in when the creator picks the
 * stablecoin option). Sourced from chain-info's curated `stablecoins` list, which is ordered with
 * `primaryStablecoin` first — so this is USDC on most chains, USDG on Robinhood, USDT0 on X Layer.
 * Always present: `buildChainTokens` refuses to register a chain without at least one stablecoin.
 */
export function getPrimaryStablecoin(chainId: UniverseChainId): Token {
  return getChainInfo(chainId).tokens.stablecoins[0]
}

/**
 * Maps RaiseCurrency + chainId to the corresponding SDK Currency.
 * Use this whenever you need a Currency from the raise-currency constant (e.g. for pool data, sorting).
 * The two options are the chain's native currency and its primary stablecoin — never hardcoded to
 * ETH/USDC, so a chain raises in AVAX/OKB and USDG/USDT0 where those are the native/primary tokens.
 */
export function getRaiseCurrencyAsCurrency(
  raiseCurrency: RaiseCurrency,
  chainId: UniverseChainId,
): Currency | undefined {
  switch (raiseCurrency) {
    case RaiseCurrency.NATIVE:
      return nativeOnChain(chainId)
    case RaiseCurrency.STABLECOIN:
      return getPrimaryStablecoin(chainId)
    default:
      return undefined
  }
}

/**
 * The on-chain address form of the raise currency, as sent in create-auction requests and
 * analytics: the zero address for the native slot, the primary stablecoin's address otherwise.
 */
export function getRaiseCurrencyAddress(raiseCurrency: RaiseCurrency, chainId: UniverseChainId): string {
  return raiseCurrency === RaiseCurrency.NATIVE ? zeroAddress : getPrimaryStablecoin(chainId).address
}

/**
 * Every on-chain currency address an auction can be denominated in on a chain — the single source
 * of truth the bid form shares with creation so the two can't accept different currency sets.
 * Native is the zero address.
 */
export function getSupportedAuctionCurrencyAddresses(chainId: UniverseChainId): string[] {
  return Object.values(RaiseCurrency).map((raiseCurrency) => getRaiseCurrencyAddress(raiseCurrency, chainId))
}
