import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { AssetLogoBaseProps } from 'components/Logo/AssetLogo'
import { SearchToken } from 'graphql/data/SearchTokens'
import { TokenQueryData } from 'graphql/data/Token'
import { TopToken } from 'graphql/data/TopTokens'
import { gqlToCurrency, supportedChainIdFromGQLChain } from 'graphql/data/util'
import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/types/chains'

export default function QueryTokenLogo(
  props: AssetLogoBaseProps & {
    token?: TopToken | TokenQueryData | SearchToken
  },
) {
  const chainId =
    (props.token?.chain ? supportedChainIdFromGQLChain(props.token?.chain) : UniverseChainId.Mainnet) ??
    UniverseChainId.Mainnet
  const currency = props.token ? gqlToCurrency(props.token) : undefined
  const logoUrl = props.token?.project?.logoUrl

  return (
    <PortfolioLogo currencies={useMemo(() => [currency], [currency])} chainId={chainId} images={[logoUrl]} {...props} />
  )
}
