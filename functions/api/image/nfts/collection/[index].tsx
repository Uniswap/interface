/* eslint-disable import/no-unused-modules */
import { ImageResponse } from '@vercel/og'
import React from 'react'

import getCollection from '../../../../utils/getCollection'
import getColor from '../../../../utils/getColor'

export async function onRequestGet({ params, request }) {
  try {
    const font = fetch(
      new URL('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZFhjQ.ttf'),
      import.meta.url
    ).then((res) => res.arrayBuffer())
    const fontData = await font

    const origin = new URL(request.url).origin
    const watermark = origin + '/images/640x125_App_Watermark.png'
    const check = origin + '/images/54x54_Verified_Check.svg'

    const { index } = params
    const collectionAddress = String(index)
    const data = await getCollection(collectionAddress, request.url)
    if (!data) {
      return new Response('Collection not found', { status: 404 })
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
              alignItems: 'center',
              backgroundColor: `rgba(${palette[0]}, ${palette[1]}, ${palette[2]}, 0.8)`,
              width: '1200px',
              height: '630px',
            }}
          >
            <img
              src={data.image}
              alt={data.name}
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
                  gap: '12px',
                  flexDirection: 'row',
                  fontSize: '72px',
                  fontFamily: 'Inter',
                }}
              >
                {data.name}
                <img src={check} height="54px" />
              </div>
              {data.isVerified && (
                <img
                  src={watermark}
                  height="60px"
                  style={{
                    opacity: '0.5',
                  }}
                />
              )}
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
