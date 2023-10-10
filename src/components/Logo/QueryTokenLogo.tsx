import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { SearchToken } from 'graphql/data/SearchTokens'
import { TokenQueryData } from 'graphql/data/Token'
import { TopToken } from 'graphql/data/TopTokens'
import { gqlToCurrency, supportedChainIdFromGQLChain } from 'graphql/data/util'

import { AssetLogoBaseProps } from './AssetLogo'

export default function QueryTokenLogo(
  props: AssetLogoBaseProps & {
    token?: TopToken | TokenQueryData | SearchToken
  }
) {
  const chainId = (props.token?.chain ? supportedChainIdFromGQLChain(props.token?.chain) : 1) ?? 1
  const currency = props.token ? gqlToCurrency(props.token) : undefined

  return <PortfolioLogo currencies={[currency]} chainId={chainId} {...props} />
}
