/* eslint-disable import/no-unused-modules */
import { ImageResponse } from '@vercel/og'
import ColorThief from 'colorthief/src/color-thief-node'
import React from 'react'

import { TokenDocument } from '../../../../src/graphql/data/__generated__/types-and-hooks'
import { getApolloClient } from '../../../utils/getApolloClient'

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
    const networkName = String(index[0]).toUpperCase()
    let tokenAddress = String(index[1])
    tokenAddress =
      tokenAddress !== 'undefined' && tokenAddress === 'NATIVE'
        ? '0x0000000000000000000000000000000000000000'
        : tokenAddress
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
      return new Response('Token not found', { status: 404 })
    }

    const name = asset.name
    const image = asset.project?.logoUrl
    const symbol = asset.symbol

    let blue = 0
    let red = 0
    let green = 0
    try {
      //get pixels in rgb format from image
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
              backgroundColor: `rgba(${red}, ${green}, ${blue}, 0.8)`,
              width: '1200px',
              height: '630px',
              padding: '72px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                gap: '24px',
                width: '90%',
              }}
            >
              <img src={image} width="168px" style={{ borderRadius: '50%' }} />
              <div
                style={{
                  fontFamily: 'Inter',
                  fontSize: '72px',
                }}
              >
                {name}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  marginLeft: '-8px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontSize: '168px',
                  }}
                >
                  {symbol}
                </div>
                <img
                  src={watermark}
                  height="72px"
                  style={{
                    opacity: 0.5,
                  }}
                />
              </div>
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
