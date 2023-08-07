/* eslint-disable import/no-unused-modules */
import { ImageResponse } from '@vercel/og'
import React from 'react'

import getAsset from '../../../../utils/getAsset'
import { getImageRequest } from '../../../../utils/getRequest'
import getSetup from '../../../../utils/getSetup'

export const onRequest: PagesFunction = async ({ params, request }) => {
  try {
    const origin = new URL(request.url).origin
    const { index } = params
    const collectionAddress = index[0]?.toString()
    const tokenId = index[1]?.toString()
    const cacheUrl = origin + '/nfts/asset/' + collectionAddress + '/' + tokenId

    const data = await getImageRequest(cacheUrl, () => getAsset(collectionAddress, tokenId, cacheUrl))

    if (!data) {
      return new Response('Asset not found.', { status: 404 })
    }

    const { fontData, watermark } = await getSetup()

    const image = new ImageResponse(
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
            <img src={watermark} alt="Uniswap" height="74px" width="324px" />
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
    return image as Response
  } catch (error: any) {
    return new Response(error.message || error.toString(), { status: 500 })
  }
}
