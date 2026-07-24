import type { Currency } from '@uniswap/sdk-core'
import { Token, WETH9 } from '@uniswap/sdk-core'
import { nativeOnChain, USDC_MAINNET, USDT } from 'uniswap/src/constants/tokens'
import { DEFAULT_NATIVE_ADDRESS_LEGACY } from 'uniswap/src/features/chains/evm/defaults'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { areEvmAddressesEqual } from 'uniswap/src/utils/addresses'
import { buildCurrencyId, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'

// Launch asset allowlist; vault addresses still come from Data API.
export const EARN_LAUNCH_CHAIN_ID = UniverseChainId.Mainnet

// Symbols used to resolve chain-specific stablecoin equivalents.
export const EARN_LAUNCH_STABLECOIN_SYMBOLS = ['USDC', 'USDT'] as const

const EARN_LAUNCH_STABLECOINS: readonly Token[] = [USDC_MAINNET, USDT]

export const EARN_EXPLORE_VAULT_CURRENCY_IDS: readonly string[] = [
  buildCurrencyId(EARN_LAUNCH_CHAIN_ID, USDT.address),
  buildCurrencyId(EARN_LAUNCH_CHAIN_ID, USDC_MAINNET.address),
  buildCurrencyId(EARN_LAUNCH_CHAIN_ID, DEFAULT_NATIVE_ADDRESS_LEGACY),
]

// Swap-upsell eligibility uses display currencies: native ETH plus launch stablecoins.
export const EARN_SWAP_UPSELL_ELIGIBLE_CURRENCY_IDS: readonly string[] = [
  buildCurrencyId(EARN_LAUNCH_CHAIN_ID, DEFAULT_NATIVE_ADDRESS_LEGACY),
  ...EARN_LAUNCH_STABLECOINS.map((token) => buildCurrencyId(EARN_LAUNCH_CHAIN_ID, token.address)),
]

export function getEarnLaunchAssetCurrency({
  chainId,
  tokenAddress,
}: {
  chainId: number
  tokenAddress: string
}): Currency | undefined {
  if (chainId !== EARN_LAUNCH_CHAIN_ID) {
    return undefined
  }

  if (isNativeCurrencyAddress(EARN_LAUNCH_CHAIN_ID, tokenAddress)) {
    return nativeOnChain(EARN_LAUNCH_CHAIN_ID)
  }

  // WETH9's record type claims Token but is sparse at runtime — keep the guard.
  const launchTokens = [WETH9[EARN_LAUNCH_CHAIN_ID], ...EARN_LAUNCH_STABLECOINS].filter(
    (token): token is Token => token !== undefined,
  )
  return launchTokens.find((token) => areEvmAddressesEqual(token.address, tokenAddress))
}
