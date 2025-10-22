import { GraphQLApi } from '@universe/api'
import client from 'functions/client'
import { Data } from 'functions/utils/cache'
import { formatTokenMetatagTitleName } from 'shared-cloud/metatags'
import { NATIVE_CHAIN_ID } from 'src/constants/tokens'

const convertTokenAddress = (networkName: string, tokenAddress: string) => {
  if (tokenAddress === NATIVE_CHAIN_ID) {
    switch (networkName) {
      case GraphQLApi.Chain.Celo:
        return '0x471EcE3750Da237f93B8E339c536989b8978a438'
      case GraphQLApi.Chain.Polygon:
        return '0x0000000000000000000000000000000000001010'
      default:
        return undefined
    }
  }
  return tokenAddress
}

export default async function getToken({
  networkName,
  tokenAddress,
  url,
}: {
  networkName: string
  tokenAddress: string
  url: string
}) {
  const origin = new URL(url).origin
  const image = origin + '/api/image/tokens/' + networkName + '/' + tokenAddress
  const uppercaseNetworkName = networkName.toUpperCase()
  const convertedTokenAddress = convertTokenAddress(uppercaseNetworkName, tokenAddress)
  const { data } = await client.query<GraphQLApi.TokenWebQuery>({
    query: GraphQLApi.TokenWebDocument,
    variables: {
      chain: uppercaseNetworkName,
      address: convertedTokenAddress,
    },
  })
  const asset = data.token
  if (!asset) {
    return undefined
  }

  const title = formatTokenMetatagTitleName(asset.symbol, asset.name)

  const formattedAsset: Data = {
    title,
    image,
    url,
    tokenData: {
      symbol: asset.symbol ?? 'UNK',
    },
    ogImage: asset.project?.logoUrl,
    name: asset.name ?? 'Token',
  }
  return formattedAsset
}
