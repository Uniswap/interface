import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { AssetLogoBaseProps } from 'components/Logo/AssetLogo'
import { getChainFromChainUrlParam } from 'constants/chains'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { GqlSearchToken } from 'graphql/data/SearchTokens'
import { TokenQueryData } from 'graphql/data/Token'
import { TopToken } from 'graphql/data/TopTokens'
import { gqlToCurrency } from 'graphql/data/util'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useMemo } from 'react'
import { TokenStat } from 'state/explore/types'
import { UniverseChainId } from 'uniswap/src/types/chains'

export default function QueryTokenLogo(
  props: AssetLogoBaseProps & {
    token?: TopToken | TokenQueryData | GqlSearchToken | TokenStat
  },
) {
  const chain = getChainFromChainUrlParam(props.token?.chain?.toLowerCase())
  const chainId = chain?.id ?? UniverseChainId.Mainnet
  const isNative = props.token?.address === NATIVE_CHAIN_ID
  const isTokenStat = !!props.token && 'volume' in props.token

  const nativeCurrency = useNativeCurrency(chainId)
  const currency = isNative ? nativeCurrency : props.token && !isTokenStat ? gqlToCurrency(props.token) : undefined

  const logoUrl = !!props.token && 'id' in props.token ? props.token?.project?.logoUrl : props.token?.logo

  const currencies = useMemo(
    () => (isTokenStat && !isNative ? undefined : [currency]),
    [currency, isNative, isTokenStat],
  )

  return <PortfolioLogo currencies={currencies} chainId={chainId} images={[logoUrl]} {...props} />
}
