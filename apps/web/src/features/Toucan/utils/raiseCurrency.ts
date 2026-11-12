import { type Currency, type Token } from '@uniswap/sdk-core'
import { type UniverseChainId, areAddressesEqual } from '@universe/chains'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { zeroAddress } from '~/chains'

/**
 * Which raise-currency option the creator picked: the chain's native currency (ETH/AVAX/OKB) or its
 * curated primary stablecoin (USDC/USDG/USDT0). Resolve to the actual token via
 * `getRaiseCurrencyAsCurrency` / `getPrimaryStablecoin`.
 */
export enum RaiseCurrency {
  // oxlint-disable-next-line eslint-js/no-restricted-syntax -- raise-currency slot name, not the NATIVE_CHAIN_ID sentinel
  NATIVE = 'NATIVE',
  STABLECOIN = 'STABLECOIN',
}

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
 * Whether a chain declares its native asset's ERC-20 representation to be its primary stablecoin,
 * so the picker would offer the same token twice (Arc, where USDC is both the native gas token and
 * an ERC-20 over the same balance). This compares addresses only — the ERC-20 form
 * named by `nativeTokenBackendAddress` carries the stablecoin's decimals, while the native option
 * is still raised in the native currency's own decimals. A chain that declares no
 * `nativeTokenBackendAddress` can never collide with its stablecoin.
 */
export function areRaiseCurrencyOptionsSameToken(chainId: UniverseChainId): boolean {
  const nativeTokenAddress = getChainInfo(chainId).backendChain.nativeTokenBackendAddress
  if (nativeTokenAddress === undefined) {
    return false
  }
  return areAddressesEqual({
    addressInput1: { address: nativeTokenAddress, chainId },
    addressInput2: { address: getPrimaryStablecoin(chainId).address, chainId },
  })
}

/**
 * The raise currency an auction is actually created with: the native option on a chain whose two
 * raise options are the same asset, whatever was selected, and the selection everywhere else.
 * This rewrites the selection rather than preserving it — a STABLECOIN pick becomes NATIVE, which
 * changes the submitted currency address to the zero address and with it the v4 pool key, so it is
 * not a no-op for someone who picked the stablecoin card before the picker was hidden.
 */
export function getEffectiveRaiseCurrency(raiseCurrency: RaiseCurrency, chainId: UniverseChainId): RaiseCurrency {
  return areRaiseCurrencyOptionsSameToken(chainId) ? RaiseCurrency.NATIVE : raiseCurrency
}

/**
 * Every on-chain currency address an auction can be denominated in on a chain — the single source
 * of truth the bid form shares with creation so the two can't accept different currency sets.
 * Native is the zero address.
 *
 * Deliberately not routed through `getEffectiveRaiseCurrency`: on a chain whose two options are the
 * same asset this still lists the stablecoin address, which creation no longer submits, because
 * auctions created before that resolution existed are denominated in it and bidding on them has to
 * keep working.
 */
export function getSupportedAuctionCurrencyAddresses(chainId: UniverseChainId): string[] {
  return Object.values(RaiseCurrency).map((raiseCurrency) => getRaiseCurrencyAddress(raiseCurrency, chainId))
}
