import { SupportedChainId } from '@pollum-io/widgets'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { TokenStandard } from 'graphql/data/__generated__/types-and-hooks'
import { SearchToken } from 'graphql/data/SearchTokens'
import { TokenQueryData } from 'graphql/data/Token'
import { TopToken } from 'graphql/data/TopTokens'
import { CHAIN_NAME_TO_CHAIN_ID } from 'graphql/data/util'
import { TokenData } from 'graphql/tokens/TokenData'

import AssetLogo, { AssetLogoBaseProps } from './AssetLogo'

function getChainId(token?: TopToken | TokenQueryData | SearchToken | TokenData): SupportedChainId | undefined {
  if (token && 'chain' in token) {
    return token?.chain ? CHAIN_NAME_TO_CHAIN_ID[token?.chain] : undefined
  } else {
    return SupportedChainId.ROLLUX
  }
}

function isNativeToken(token?: TopToken | TokenQueryData | SearchToken | TokenData): boolean {
  if (token && 'address' in token && 'standard' in token) {
    return !token?.address || token?.standard === TokenStandard.Native || token?.address === NATIVE_CHAIN_ID
  } else {
    // TODO check if token rollux is native token
    return false
  }
}
export default function QueryTokenLogo(
  props: AssetLogoBaseProps & {
    token?: TopToken | TokenQueryData | SearchToken | TokenData
  }
) {
  const { token } = props
  const chainId = getChainId(token)
  const isNative = isNativeToken(token)

  const address = token && 'address' in token ? token.address : token && 'id' in token ? token.id : undefined
  const backupImg = token && 'project' in token && token?.project ? token.project.logoUrl : undefined

  return (
    <AssetLogo
      isNative={isNative}
      chainId={chainId}
      address={address}
      symbol={token?.symbol}
      backupImg={backupImg}
      {...props}
    />
  )
}
