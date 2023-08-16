/* eslint-disable import/no-unused-modules */
import { ImageResponse } from '@vercel/og'
import React from 'react'

import { WATERMARK_URL } from '../../../constants'
import getAddress from '../../../utils/getAddress'
import getFont from '../../../utils/getFont'
import { getRequest } from '../../../utils/getRequest'

export const onRequest: PagesFunction = async ({ params, request }) => {
  try {
    const origin = new URL(request.url).origin
    const { index } = params
    const address = index?.toString()
    const cacheUrl = origin + '/address/' + address

    const data = await getRequest(
      cacheUrl,
      () => getAddress(address, cacheUrl),
      (data): data is NonNullable<Awaited<ReturnType<typeof getAddress>>> => Boolean(data.ogImage && data.name)
    )

    if (!data) {
      return new Response('Collection not found.', { status: 404 })
    }

    const fontData = await getFont()

    return new ImageResponse(
      (
        <div
          style={{
            backgroundColor: 'black',
            display: 'flex',
            width: '1200px',
            height: '630px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: `rgba(255, 255, 255, 0.75)`,
              padding: '72px',
            }}
          >
            <img src={WATERMARK_URL} alt="Uniswap" height="72px" width="324px" />
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
    ) as Response
  } catch (error: any) {
    return new Response(error.message || error.toString(), { status: 500 })
  }
}
