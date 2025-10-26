import { GraphQLApi } from '@universe/api'
import { TokenItemData } from 'src/components/explore/TokenItemData'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { token } from 'uniswap/src/test/fixtures'
import { createFixture } from 'uniswap/src/test/utils'

type TokenItemDataOptions = {
  token: GraphQLApi.Token | null
}

export const tokenItemData = createFixture<TokenItemData, TokenItemDataOptions>({
  token: null,
})(({ token: t }) => {
  const defaultToken = token()

  return {
    name: t?.name ?? defaultToken.name,
    logoUrl: t?.project?.logo?.url ?? defaultToken.project.logo.url,
    chainId: UniverseChainId.Mainnet,
    address: t?.address ?? defaultToken.address,
    symbol: t?.symbol ?? defaultToken.symbol,
  }
})

export const TOKEN_ITEM_DATA = tokenItemData({ name: 'tkn' })
