/* eslint-disable import/no-unused-modules */
import { ImageResponse } from '@vercel/og'
import React from 'react'

import getColor from '../../../utils/getColor'
import getNetworkLogoUrl from '../../../utils/getNetworkLogoURL'
import { getImageRequest } from '../../../utils/getRequest'
import getSetup from '../../../utils/getSetup'
import getToken from '../../../utils/getToken'

export const onRequest: PagesFunction = async ({ params, request }) => {
  try {
    const origin = new URL(request.url).origin
    const { index } = params
    const networkName = String(index[0])
    const tokenAddress = String(index[1])

    const cacheUrl = origin + '/tokens/' + networkName + '/' + tokenAddress

    const data = await getImageRequest(cacheUrl, () => getToken(networkName, tokenAddress, cacheUrl))

    if (!data) {
      return new Response('Asset not found.', { status: 404 })
    }

    data.ogImage = data.ogImage ?? origin + '/images/192x192_App_Icon.png'
    data.name = data.name ?? 'Token'
    data.symbol = data.symbol ?? 'UNK'

    const [setup, palette] = await Promise.all([getSetup(), getColor(data.ogImage)])
    const { fontData, watermark } = setup

    const networkLogo = getNetworkLogoUrl(networkName.toUpperCase())

    // Capitalize name such that each word starts with a capital letter
    let words = data.name.split(' ')
    words = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    let name = words.join(' ')
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
              <img src={data.ogImage} width="144px" style={{ borderRadius: '100%' }}>
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
