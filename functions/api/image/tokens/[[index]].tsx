/* eslint-disable import/no-unused-modules */
import { ImageResponse } from '@vercel/og'
import React from 'react'

import getColor from '../../../utils/getColor'
import getToken from '../../../utils/getToken'

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
    const data = await getToken(networkName, tokenAddress, request.url)
    if (!data) {
      return new Response('Token not found', { status: 404 })
    }

    const palette = await getColor(data.image)

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
              backgroundColor: `rgba(${palette[0]}, ${palette[1]}, ${palette[2]}, 0.8)`,
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
              <img src={data.image} width="168px" style={{ borderRadius: '50%' }} />
              <div
                style={{
                  fontFamily: 'Inter',
                  fontSize: '72px',
                }}
              >
                {data.name}
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
                  {data.symbol}
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
