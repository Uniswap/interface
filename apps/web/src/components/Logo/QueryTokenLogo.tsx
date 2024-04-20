import { ChainId } from '@jaguarswap/sdk-core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { SearchToken } from 'graphql/data/SearchTokens'
import { TokenQueryData } from 'graphql/data/Token'
import { TokenData } from 'graphql/data/useV3Token'
import { gqlToCurrency } from 'graphql/data/util'
import { useMemo } from 'react'
import { useAppSelector } from 'state/hooks'
import { AppState } from 'state/reducer'
import { getInitialUrl } from 'hooks/useAssetLogoSource'

import { AssetLogoBaseProps } from './AssetLogo'
import store from '../../state'

export default function QueryTokenLogo(
  props: AssetLogoBaseProps & {
    token?: TokenData | TokenQueryData | SearchToken
  }
) {
  const chainId = useAppSelector((state: AppState) => state.application.id)

  const currency = props.token ? gqlToCurrency(props.token, chainId) : undefined

  const logoUrl = getInitialUrl(
    currency.address,
    currency.chainId,
    currency.isNative
  )

  return <PortfolioLogo currencies={useMemo(() => [currency], [currency])} chainId={chainId} images={[logoUrl]} {...props} />
}
