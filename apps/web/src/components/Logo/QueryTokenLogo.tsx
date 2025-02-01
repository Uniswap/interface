import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { AssetLogoBaseProps } from 'components/Logo/AssetLogo'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { GqlSearchToken } from 'graphql/data/SearchTokens'
import { gqlToCurrency } from 'graphql/data/util'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useMemo } from 'react'
import { TokenStat } from 'state/explore/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainIdFromChainUrlParam } from 'utils/chainParams'

export default function QueryTokenLogo(
  props: AssetLogoBaseProps & {
    token?: GqlSearchToken | TokenStat
  },
) {
  const chainId = getChainIdFromChainUrlParam(props.token?.chain.toLowerCase()) ?? UniverseChainId.Mainnet
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
