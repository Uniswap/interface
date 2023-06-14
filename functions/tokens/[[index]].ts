/* eslint-disable import/no-unused-modules */
import { ApolloClient, InMemoryCache } from '@apollo/client'

import { TokenDocument } from '../../src/graphql/data/__generated__/types-and-hooks'

export function networkNameToID(networkName: string) {
  switch (networkName) {
    case 'mainnet':
      return 1
    case 'goerli':
      return 5
    case 'sepolia':
      return 11155111
    case 'polygon':
      return 137
    case 'celo':
      return 42220
    case 'optimism':
      return 10
    case 'arbitrum':
      return 42161
    case 'bnb':
      return 56
    default:
      return 1
  }
} 

const GRAPHQL_ENDPOINT = 'https://api.uniswap.org/v1/graphql'

type MetaTagInjectorInput = {
  name: any
  network: any
  price: any
  image: any
  uniswapUrl: any
  symbol: any
}

class MetaTagInjector {
  private input: MetaTagInjectorInput

  constructor(input: MetaTagInjectorInput) {
    this.input = input
  }

  element(element) {
    //Open Graph Tags
    element.append(`<meta property="og:title" content = "${this.input.name} on Uniswap"/>`, {
      html: true,
    })
    element.append(
      `<meta property="og:description" content = "${this.input.name} on the ${this.input.network} network. 1 ${this.input.symbol} = $${this.input.price}."/>`,
      {
        html: true,
      }
    )
    element.append(`<meta property="og:image" content = "${this.input.image}"/>`, {
      html: true,
    })
    element.append(`<meta property="og:image:width" content = "1200"/>`, {
      html: true,
    })
    element.append(`<meta property="og:image:height" content = "600"/>`, {
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
    element.append(`<meta property="twitter:title" content = "${this.input.name} on Uniswap"/>`, {
      html: true,
    })
    element.append(
      `<meta property="twitter:description" content = "${this.input.name} on the ${this.input.network} network. 1 ${this.input.symbol} = $${this.input.price}."/>`,
      {
        html: true,
      }
    )
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
  const networkName = String(index[0]).toUpperCase()
  const tokenAddress = String(index[1])
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
      query: TokenDocument,
      variables: {
        chain: networkName,
        address: tokenAddress,
      },
    })
    const asset = data?.token
    if (!asset) {
      return await next()
    }
    console.log(asset)
    const formattedAsset = {
      name: asset.name,
      network: networkName,
      price: asset.market?.price?.value ? asset.market.price.value : 0, 
      image: asset.project?.logoUrl,
      uniswapUrl: request.url,
      symbol: asset.symbol,
    }
    return new HTMLRewriter().on('head', new MetaTagInjector(formattedAsset)).transform(await next())
  } catch (e) {
    console.log(e)
    return await next()
  }
}
