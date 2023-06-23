/* eslint-disable import/no-unused-modules */
import { ImageResponse } from '@vercel/og'
import React from 'react'

const font = fetch(
  new URL('https://fonts.gstatic.com/s/notosans/v28/o-0OIpQlx3QUlC5A4PNjhgRMQ_w.ttf'),
  import.meta.url
).then((res) => res.arrayBuffer())

export async function onRequestGet(context) {
  try {
    const fontData = await font

    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 128,
            background: 'white',
            width: '100%',
            height: '100%',
            display: 'flex',
            textAlign: 'center',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Hello World!
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Noto Sans',
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
