import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { SearchToken } from 'graphql/data/SearchTokens'
import { TokenQueryData } from 'graphql/data/Token'
import { TopToken } from 'graphql/data/TopTokens'
import { CHAIN_NAME_TO_CHAIN_ID } from 'graphql/data/util'

import AssetLogo, { AssetLogoBaseProps } from './AssetLogo'

export default function QueryTokenLogo(
  props: AssetLogoBaseProps & {
    token?: TopToken | TokenQueryData | SearchToken
  }
) {
  const chainId = props.token?.chain ? CHAIN_NAME_TO_CHAIN_ID[props.token?.chain] : undefined

  return (
    <AssetLogo
      isNative={props.token?.standard === 'NATIVE' || props.token?.address === NATIVE_CHAIN_ID}
      chainId={chainId}
      address={props.token?.address}
      symbol={props.token?.symbol}
      backupImg={props.token?.project?.logoUrl}
      {...props}
    />
  )
}
