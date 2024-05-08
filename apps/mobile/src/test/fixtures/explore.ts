import { TokenItemData } from 'src/components/explore/TokenItem'
import { Token } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ChainId } from 'wallet/src/constants/chains'
import { fromGraphQLChain } from 'wallet/src/features/chains/utils'
import { token } from 'wallet/src/test/fixtures'
import { createFixture } from 'wallet/src/test/utils'

type TokenItemDataOptions = {
  token: Token | null
}

export const tokenItemData = createFixture<TokenItemData, TokenItemDataOptions>({
  token: null,
})(({ token: t }) => {
  const defaultToken = token()
  const chain = t?.chain ?? defaultToken.chain

  return {
    name: t?.name ?? defaultToken.name,
    logoUrl: t?.project?.logo?.url ?? defaultToken.project.logo.url,
    chainId: fromGraphQLChain(chain) ?? ChainId.Mainnet,
    address: t?.address ?? defaultToken.address,
    symbol: t?.symbol ?? defaultToken.symbol,
  }
})

export const TOKEN_ITEM_DATA = tokenItemData()
