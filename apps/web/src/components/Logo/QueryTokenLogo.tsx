import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { AssetLogoBaseProps } from 'components/Logo/AssetLogo'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useMemo } from 'react'
import { TokenStat } from 'state/explore/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainIdFromChainUrlParam } from 'utils/chainParams'

export default function QueryTokenLogo(
  props: AssetLogoBaseProps & {
    token?: TokenStat
  },
) {
  const chainId = getChainIdFromChainUrlParam(props.token?.chain.toLowerCase()) ?? UniverseChainId.Mainnet
  const isNative = props.token?.address === NATIVE_CHAIN_ID

  const nativeCurrency = useNativeCurrency(chainId)
  const currency = isNative ? nativeCurrency : undefined

  const currencies = useMemo(() => (!isNative ? undefined : [currency]), [currency, isNative])

  return <PortfolioLogo currencies={currencies} chainId={chainId} images={[props.token?.logo]} {...props} />
}
