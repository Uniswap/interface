/* eslint-disable import/no-unused-modules */
import { ImageResponse } from '@vercel/og'
import React from 'react'

import getColor from '../../../utils/getColor'
import getSetup from '../../../utils/getSetup'
import getToken from '../../../utils/getToken'
import getNetworkLogoUrl from '../../../utils/getNetworkLogoURL'

export async function onRequestGet({ params, request }) {
  try {
    const { fontData, watermark } = await getSetup(request)

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
    const networkLogo = getNetworkLogoUrl(networkName)

    const words = data.name.split(' ')
    let name = ''
    for (let i = 0; i < words.length; i++) {
      name += words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase() + ' '
    }
    name = name.trim()

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
              backgroundColor: `rgba(${palette[0]}, ${palette[1]}, ${palette[2]}, 0.8)`,
              alignItems: 'center',
              height: '100%',
              padding: '72px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                width: '100%',
                height: '100%',
                color: 'white',
              }}
            >
              <img
                src={data.image}
                width="144px"
              >
                {networkLogo != '' && (<img
                  src = {networkLogo}
                  width="48px"
                  style={{
                    position: 'absolute',
                    right: '2px',
                    bottom: '0px',
                    borderRadius: '100%',
                  }}
                />)}
              </img>
              <div
                style={{
                  fontFamily: 'Inter',
                  fontSize: '72px',
                  lineHeight: '58px',
                  marginLeft: '-5px',
                  marginTop: '24px',
                }}
              >
                {name}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontSize: '168px',
                    lineHeight: '133px',
                    marginLeft: '-13px',
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
