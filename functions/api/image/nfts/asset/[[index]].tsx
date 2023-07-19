/* eslint-disable import/no-unused-modules */
import { ImageResponse } from '@vercel/og'
import React from 'react'

import getAsset from '../../../../utils/getAsset'
import getSetup from '../../../../utils/getSetup'

export async function onRequestGet({ params, request }) {
  try {
    const { fontData, watermark } = await getSetup(request)

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
          <img src={data.ogImage} alt={data.title} width="1200px" />
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
