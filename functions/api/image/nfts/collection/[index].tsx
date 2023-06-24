/* eslint-disable import/no-unused-modules */
import { ApolloClient, InMemoryCache } from '@apollo/client'
import { ImageResponse } from '@vercel/og'
import ColorThief from 'colorthief/src/color-thief-node'
import React from 'react'

import { CollectionDocument } from '../../../../../src/graphql/data/__generated__/types-and-hooks'

const GRAPHQL_ENDPOINT = 'https://api.uniswap.org/v1/graphql'

export async function onRequestGet({ params, request }) {
  try {
    const font = fetch(
      new URL('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZFhjQ.ttf'),
      import.meta.url
    ).then((res) => res.arrayBuffer())
    const fontData = await font

    const origin = new URL(request.url).origin
    const watermark = origin + '/images/640x125_App_Watermark.png'

    const { index } = params
    const collectionAddress = String(index)
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
      query: CollectionDocument,
      variables: {
        addresses: collectionAddress,
      },
    })
    const collection = data?.nftCollections?.edges[0]?.node
    if (!collection || !collection.name) {
      return new Response('Collection not found', { status: 404 })
    }

    const name = collection.name
    const image = collection.image?.url
    let blue = 0
    let red = 0
    let green = 0
    try {
      const data = await fetch(image)
        .then((res) => res.arrayBuffer())
        .then((arrayBuffer) => Buffer.from(arrayBuffer))
      const palette = ColorThief.getPalette(data)
      red = palette[0][0]
      green = palette[0][1]
      blue = palette[0][2]
    } catch (e) {
      console.log(e)
    }
    //const isVerified = collection.isVerified

    return new ImageResponse(
      (
        <div
          style={{
            backgroundColor: 'black',
            display: 'flex',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: `rgba(${red}, ${green}, ${blue}, 0.8)`,
              width: '1200px',
              height: '630px',
            }}
          >
            <img
              src={image}
              alt={name}
              width="500px"
              style={{
                borderRadius: '24px',
                boxShadow: '0px 0px 24px rgba(0, 0, 0, 0.25)',
                margin: '0px 72px 0px 72px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '72px',
                left: '644px',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                gap: '32px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                  flexDirection: 'row',
                  fontSize: '72px',
                  fontFamily: 'Inter',
                }}
              >
                {name}
              </div>
              <img src={watermark} height="60px" />
            </div>
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
