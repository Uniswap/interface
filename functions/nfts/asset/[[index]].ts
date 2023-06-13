/* eslint-disable import/no-unused-modules */
import { ApolloClient, InMemoryCache } from '@apollo/client'

import { AssetDocument } from '../../../src/graphql/data/__generated__/types-and-hooks'

type MetaTagInjectorInput = {
  id: any
  tokenId: any
  address: any
  name: any
  image: any
  collectionName: any
  rarity: any
}

class MetaTagInjector {
  private input: MetaTagInjectorInput

  constructor(input: MetaTagInjectorInput) {
    this.input = input
  }

  element(element) {
    element.append(`<meta property="og:title" content = "${this.input.name}"/>`, {
      html: true,
    })
    element.append(
      `<meta property="og:description" content = "Token #${this.input.id} from ${this.input.collectionName}. Rarity Rank #${this.input.rarity}"/>`,
      {
        html: true,
      }
    )
    element.append(`<meta property="og:image" content = "${this.input.image}"/>`, {
      html: true,
    })
    element.append('<meta property="og:type" content = "website"/>', {
      html: true,
    })
    element.append(`<meta property="og:image width" content = "1200"/>`, {
      html: true,
    })
    element.append(`<meta property="og:image height" content = "600"/>`, {
      html: true,
    })
  }
}

export const onRequest: PagesFunction<{}> = async ({ params, request, env, next }) => {
  console.log(request.url)
  const { index } = params
  const collectionAddress = String(index[0])
  const tokenId = String(index[1])
  try {
    const client = new ApolloClient({
      uri: GRAPHQL_ENDPOINT,
      cache: new InMemoryCache(),
    })
    console.log('Fetching asset...')
    const { data } = await client.query({
      query: AssetDocument,
      variables: {
        address: collectionAddress,
        filter: {
          tokenIds: {
            in: [tokenId],
          },
        },
      },
    })
    console.log(data)
    const asset = data?.nftAssets?.edges[0].node
    if (!asset) {
      return await next()
    }
    const formattedAsset = {
      id: asset.id,
      tokenId: asset.tokenId,
      address: collectionAddress,
      name: asset.name,
      image: asset.image?.url,
      collectionName: asset.collection?.name,
      rarity: asset.rarities?.[0]?.rank,
    }
    return new HTMLRewriter().on('head', new MetaTagInjector(formattedAsset)).transform(await next())
  } catch (e) {
    console.log(e)
    return await next()
  }
}
