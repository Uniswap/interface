/* eslint-disable import/no-unused-modules */
import { ApolloClient, InMemoryCache } from '@apollo/client'

import { AssetDocument } from '../../../src/graphql/data/__generated__/types-and-hooks'

const GRAPHQL_ENDPOINT = 'https://api.uniswap.org/v1/graphql'

type MetaTagInjectorInput = {
  id: any
  tokenId: any
  address: any
  name: any
  image: any
  collectionName: any
  rarity: any
  uniswapUrl: any
  listing: any
}

class MetaTagInjector {
  private input: MetaTagInjectorInput

  constructor(input: MetaTagInjectorInput) {
    this.input = input
  }

  element(element) {
    //Open Graph Tags
    element.append(`<meta property="og:title" content = "${this.input.name}"/>`, {
      html: true,
    })
    element.append(`<meta property="og:image" content = "${this.input.image}"/>`, {
      html: true,
    })
    element.append(`<meta property="og:image:width" content = "1200"/>`, {
      html: true,
    })
    element.append(`<meta property="og:image:height" content = "630"/>`, {
      html: true,
    })
    element.append('<meta property="og:type" content = "website"/>', {
      html: true,
    })
    element.append(`<meta property="og:url" content = "${this.input.uniswapUrl}"/>`, {
      html: true,
    })
    element.append(`<meta property="og:image:alt" content = "https://app.uniswap.org/images/512x512_App_Icon.png"/>`, {
      html: true,
    })
    //Twitter Tags
    element.append(`<meta property="twitter:card" content = "summary_large_image"/>`, {
      html: true,
    })
    element.append(`<meta property="twitter:title" content = "${this.input.name}"/>`, {
      html: true,
    })
    element.append(`<meta property="twitter:image" content = "${this.input.image}"/>`, {
      html: true,
    })
    element.append(
      `<meta property="twitter:image:alt" content = "https://app.uniswap.org/images/512x512_App_Icon.png"/>`,
      {
        html: true,
      }
    )
  }
}

export const onRequest: PagesFunction<{}> = async ({ params, request, env, next }) => {
  const { index } = params
  const collectionAddress = String(index[0])
  const tokenId = String(index[1])
  try {
    const client = new ApolloClient({
      connectToDevTools: true,
      uri: GRAPHQL_ENDPOINT,
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://app.uniswap.org',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.110 Safari/537.36',
      },
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'cache-and-network',
        },
      },
    })
    const { data } = await client.query({
      query: AssetDocument,
      variables: {
        address: collectionAddress,
        filter: {
          tokenIds: [tokenId],
        },
      },
    })
    const asset = data?.nftAssets?.edges[0]?.node
    if (!asset) {
      return await next()
    }
    const listing = asset.listings.edges[0]?.node
    const listingInfo = listing
      ? `Currently listed on ${listing.marketplace} for ${listing.price.value} ETH`
      : 'Not currently listed'
    const formattedAsset = {
      id: asset.id,
      tokenId: asset.tokenId,
      address: collectionAddress,
      name: asset.name ? asset.name : asset.collection?.name + ' #' + asset.tokenId,
      image: asset.image?.url,
      collectionName: asset.collection?.name,
      rarity: asset.rarities?.[0]?.rank,
      uniswapUrl: request.url,
      listing: listingInfo,
    }
    return new HTMLRewriter().on('head', new MetaTagInjector(formattedAsset)).transform(await next())
  } catch (e) {
    console.log(e)
    return await next()
  }
}
