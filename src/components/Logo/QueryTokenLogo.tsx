import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { TokenStandard } from 'graphql/data/__generated__/types-and-hooks'
import { SearchToken } from 'graphql/data/SearchTokens'
import { TokenQueryData } from 'graphql/data/Token'
import { TopToken } from 'graphql/data/TopTokens'
import { supportedChainIdFromGQLChain } from 'graphql/data/util'

import AssetLogo, { AssetLogoBaseProps } from './AssetLogo'

export default function QueryTokenLogo(
  props: AssetLogoBaseProps & {
    token?: TopToken | TokenQueryData | SearchToken
  }
) {
  const chainId = props.token?.chain ? supportedChainIdFromGQLChain(props.token?.chain) : undefined

  return (
    <AssetLogo
      isNative={
        // TODO(cartcrom): simplify this check after backend fixes token standard on assetActivities tokens
        !props.token?.address ||
        props.token?.standard === TokenStandard.Native ||
        props.token?.address === NATIVE_CHAIN_ID
      }
      chainId={chainId}
      address={props.token?.address}
      symbol={props.token?.symbol}
      backupImg={props.token?.project?.logoUrl}
      {...props}
    />
  )
}
