/* eslint-disable import/no-unused-modules */
import { ImageResponse } from '@vercel/og'
import React from 'react'

import getCollection from '../../../../utils/getCollection'
import getColor from '../../../../utils/getColor'
import getSetup from '../../../../utils/getSetup'

export const onRequest: PagesFunction = async ({ params, request }) => {
  try {
    const { index } = params
    const collectionAddress = index?.toString()
    const data = await getCollection(collectionAddress, request.url)

    if (!data) {
      return new Response('Collection not found', { status: 404 })
    }
    const setupPromise = getSetup()
    const palettePromise = getColor(data.ogImage)

    const [setup, palette] = await Promise.all([setupPromise, palettePromise])
    const { fontData, watermark, check } = setup
    const words = data.name.split(' ')

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
              alignItems: 'center',
              backgroundColor: `rgba(${palette[0]}, ${palette[1]}, ${palette[2]}, 0.75)`,
              padding: '72px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end',
                gap: '48px',
                width: '100%',
              }}
            >
              <img
                src={data.ogImage}
                alt={data.name}
                width="500px"
                height="500px"
                style={{
                  borderRadius: '60px',
                  objectFit: 'cover',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '32px',
                  width: '50%',
                }}
              >
                <div
                  style={{
                    gap: '12px',
                    fontSize: '72px',
                    fontFamily: 'Inter',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  {words.map((word: string) => (
                    <text key={word}>{word}</text>
                  ))}
                  {data.isVerified && <img src={check} height="54px" />}
                </div>
                <img
                  src={watermark}
                  height="72px"
                  style={{
                    opacity: '0.5',
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
