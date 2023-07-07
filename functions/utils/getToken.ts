import { TokenDocument } from '../../src/graphql/data/__generated__/types-and-hooks'
import { getApolloClient } from './getApolloClient'

export default async function getToken(networkName: string, tokenAddress: string, url: string) {
  const client = getApolloClient()
  const { data } = await client.query({
    query: TokenDocument,
    variables: {
      chain: networkName,
      address: tokenAddress,
    },
  })
  const asset = data?.token
  if (!asset) {
    return undefined
  }
  const formattedAsset = {
    name: asset.name,
    network: networkName,
    image: asset.project?.logoUrl,
    uniswapUrl: url,
    symbol: asset.symbol,
  }
  return formattedAsset
}
