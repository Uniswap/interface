import { ChainId } from '@pollum-io/smart-order-router'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { TokenStandard } from 'graphql/data/__generated__/types-and-hooks'
import { SearchToken } from 'graphql/data/SearchTokens'
import { TokenQueryData } from 'graphql/data/Token'
import { TokenData } from 'graphql/tokens/TokenData'
import { CHAIN_NAME_TO_CHAIN_ID } from 'graphql/utils/util'

import AssetLogo, { AssetLogoBaseProps } from './AssetLogo'

function getChainId(token?: TokenQueryData | SearchToken | TokenData): ChainId | undefined {
  if (token && 'chain' in token) {
    return token?.chain ? CHAIN_NAME_TO_CHAIN_ID[token?.chain] : undefined
  } else {
    return ChainId.ROLLUX
  }
}

function isNativeToken(token?: TokenQueryData | SearchToken | TokenData): boolean {
  if (token && 'address' in token && 'standard' in token) {
    return !token?.address || token?.standard === TokenStandard.Native || token?.address === NATIVE_CHAIN_ID
  } else {
    // TODO check if token rollux is native token
    return false
  }
}
export default function QueryTokenLogo(
  props: AssetLogoBaseProps & {
    token?: TokenData | TokenQueryData | SearchToken | TokenData
  }
) {
  const { token } = props
  const chainId = getChainId(token)
  const isNative = isNativeToken(token)

  const address = token && 'address' in token ? token.address : token && 'id' in token ? token.id : undefined
  const backupImg = `https://raw.githubusercontent.com/pegasys-fi/default-token-list/master/src/logos/${chainId}/${address}/logo.png`

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
