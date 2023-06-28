/* eslint-disable import/no-unused-modules */
import { ImageResponse } from '@vercel/og'
import React from 'react'

import getAsset from '../../../../utils/getAsset'

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
    const collectionAddress = String(index[0])
    const tokenId = String(index[1])

    const data = await getAsset(collectionAddress, tokenId, request.url)
    if (!data) {
      return new Response('Asset not found.', { status: 404 })
    }

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
          <img src={data.image} alt={data.name} width="1200px" />
          <div
            style={{
              position: 'absolute',
              bottom: '72px',
              right: '72px',
              display: 'flex',
              gap: '24px',
            }}
          >
            <img src={watermark} height="72px" />
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
