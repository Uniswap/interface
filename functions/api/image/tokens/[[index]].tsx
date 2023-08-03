/* eslint-disable import/no-unused-modules */
import { ImageResponse } from '@vercel/og'
import React from 'react'

import getColor from '../../../utils/getColor'
import getNetworkLogoUrl from '../../../utils/getNetworkLogoURL'
import getSetup from '../../../utils/getSetup'
import getToken from '../../../utils/getToken'

export const onRequest: PagesFunction = async ({ params, request }) => {
  try {
    const { index } = params
    const networkName = String(index[0])
    const tokenAddress = String(index[1])

    const data = await getToken(networkName, tokenAddress, request.url)
    if (!data) {
      return new Response('Token not found', { status: 404 })
    }

    const setupPromise = getSetup(request)
    const palettePromise = getColor(data.ogImage)

    const [setup, palette] = await Promise.all([setupPromise, palettePromise])
    const { fontData, watermark } = setup

    const networkLogo = getNetworkLogoUrl(networkName)
    const words = data.name.split(' ')
    let name = ''
    for (let i = 0; i < words.length; i++) {
      name += words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase() + ' '
    }
    name = name.trim()

    const image = new ImageResponse(
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
              <img src={data.ogImage} width="144px">
                {networkLogo != '' && (
                  <img
                    src={networkLogo}
                    width="48px"
                    style={{
                      position: 'absolute',
                      right: '2px',
                      bottom: '0px',
                      borderRadius: '100%',
                    }}
                  />
                )}
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
    return image as Response
  } catch (error: any) {
    return new Response(error.message || error.toString(), { status: 500 })
  }
}
