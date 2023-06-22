/* eslint-disable import/no-unused-modules */
import { ApolloClient, InMemoryCache } from '@apollo/client'
import { ImageResponse } from '@vercel/og'
import React from 'react'

import { AssetDocument } from '../../../../../src/graphql/data/__generated__/types-and-hooks'

const GRAPHQL_ENDPOINT = 'https://api.uniswap.org/v1/graphql'

const font = fetch(
  new URL('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZFhjQ.ttf'),
  import.meta.url
).then((res) => res.arrayBuffer())

export async function onRequestGet({ params, request }) {
  try {
    const fontData = await font

    const { index } = params
    const collectionAddress = String(index[0])
    const tokenId = String(index[1])

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
      return new Response('Asset not found', { status: 404 })
    }
    const name = asset.name ? asset.name : asset.collection?.name + ' #' + asset.tokenId
    const image = asset.image?.url

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            width: '1200px',
            height: '630px',
          }}
        >
          <img src={image} alt={name} width="1200px" />
          <div
            style={{
              position: 'absolute',
              bottom: '72px',
              right: '72px',
              fontSize: '60px',
              fontFamily: 'Inter',
              color: 'black',
              display: 'flex',
              gap: '24px',
            }}
          >
            <img src="https://app.uniswap.org/favicon.png" width="60px" height="60px" />
            Uniswap
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Inter',
            data: fontData,
            style: 'normal',
          },
        ],
      }
    )
  } catch (error) {
    return new Response(error.message || error.toString(), { status: 500 })
  }
}
