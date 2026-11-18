import { TestID } from '@universe/test'
import type { TokenLogoImageSource, TokenLogoProps } from '@universe/transactions-ui'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

/**
 * A CurrencyInfo as TokenLogo view props: what CurrencyLogo renders through TokenLogo and its
 * NetworkLogo badge with the default props. The badge shows on every chain, mainnet included,
 * whenever the chain has a logo.
 */
export function getTokenLogoProps(
  currencyInfo: CurrencyInfo,
): Pick<TokenLogoProps, 'url' | 'symbol' | 'name' | 'isTestnet' | 'badge'> {
  const { currency, logoUrl } = currencyInfo
  const { chainId, symbol, name } = currency
  const chainLogo = toTokenLogoImageSource(getChainInfo(chainId).logo)

  return {
    url: logoUrl ?? undefined,
    symbol,
    name,
    isTestnet: isTestnetChain(chainId),
    badge:
      chainLogo === undefined
        ? undefined
        : { kind: 'network', logo: chainLogo, testID: `${TestID.NetworkLogoPrefix}${chainId}` },
  }
}

/** Chain logos are bundled assets: a URL on web, a require() id on native. NetworkLogo drew nothing for an empty one. */
function toTokenLogoImageSource(logo: unknown): TokenLogoImageSource | undefined {
  return logo && (typeof logo === 'string' || typeof logo === 'number') ? logo : undefined
}
