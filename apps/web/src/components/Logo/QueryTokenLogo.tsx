import { GqlSearchToken } from 'appGraphql/data/SearchTokens'
import { gqlToCurrency } from 'appGraphql/data/util'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { AssetLogoBaseProps } from 'components/Logo/AssetLogo'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useMemo } from 'react'
import { RingTokenStat, TokenStat } from 'state/explore/types'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainIdFromChainUrlParam } from 'utils/chainParams'

function getTokenProjectLogoUrl(token?: GqlSearchToken | TokenStat | RingTokenStat): string | undefined {
  const projectLogoUrl = token?.project && 'logoUrl' in token.project ? token.project.logoUrl : undefined
  const projectLogo = token?.project && 'logo' in token.project ? token.project.logo?.url : undefined
  const tokenLogo = token && 'logo' in token && typeof token.logo === 'string' ? token.logo : undefined

  return projectLogoUrl ?? projectLogo ?? tokenLogo ?? undefined
}

export default function QueryTokenLogo(
  props: AssetLogoBaseProps & {
    token?: GqlSearchToken | TokenStat
  },
) {
  const chainId = getChainIdFromChainUrlParam(props.token?.chain.toLowerCase()) ?? UniverseChainId.Mainnet
  const isNative = props.token?.address === NATIVE_CHAIN_ID
  const isTokenStat = !!props.token && 'volume' in props.token

  const nativeCurrency = useNativeCurrency(chainId)
  const currency = isNative
    ? nativeCurrency
    : props.token && !isTokenStat
      ? gqlToCurrency(props.token as Parameters<typeof gqlToCurrency>[0])
      : undefined

  const logoUrl = getTokenProjectLogoUrl(props.token)

  const currencies = useMemo(
    () => (isTokenStat && !isNative ? undefined : [currency]),
    [currency, isNative, isTokenStat],
  )

  return <PortfolioLogo currencies={currencies} chainId={chainId} images={[logoUrl]} {...props} />
}

export function QueryRingTokenLogo(
  props: AssetLogoBaseProps & {
    token?: GqlSearchToken | RingTokenStat
  },
) {
  const chainId = getChainIdFromChainUrlParam(props.token?.chain.toLowerCase()) ?? UniverseChainId.Mainnet
  const isNative = props.token?.address === NATIVE_CHAIN_ID
  const nativeLogo = getChainInfo(chainId).nativeCurrency.logo
  const nativeLogoUrl = typeof nativeLogo === 'string' ? nativeLogo : undefined

  const logoUrl = getTokenProjectLogoUrl(props.token)

  return <PortfolioLogo chainId={chainId} images={[isNative ? nativeLogoUrl : logoUrl]} {...props} />
}
