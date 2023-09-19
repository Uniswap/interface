/* eslint-disable import/no-unused-modules */
import { ImageResponse } from '@vercel/og'
import React from 'react'

import { blocklistedCollections } from '../../../../../src/nft/utils/blocklist'
import { CHECK_URL, WATERMARK_URL } from '../../../../constants'
import getCollection from '../../../../utils/getCollection'
import getColor from '../../../../utils/getColor'
import getFont from '../../../../utils/getFont'
import { getRequest } from '../../../../utils/getRequest'

export const onRequest: PagesFunction = async ({ params, request }) => {
  try {
    const origin = new URL(request.url).origin
    const { index } = params
    const collectionAddress = index?.toString()
    const cacheUrl = origin + '/nfts/collection/' + collectionAddress

    if (blocklistedCollections.includes(collectionAddress)) {
      return new Response('Collection unsupported.', { status: 404 })
    }

    const data = await getRequest(
      cacheUrl,
      () => getCollection(collectionAddress, cacheUrl),
      (data): data is NonNullable<Awaited<ReturnType<typeof getCollection>>> =>
        Boolean(data.ogImage && data.name && data.isVerified)
    )

    if (!data) {
      return new Response('Collection not found.', { status: 404 })
    }

    const [fontData, palette] = await Promise.all([getFont(origin), getColor(data.ogImage)])

    // Split name into words to wrap them since satori does not support inline text wrapping
    const words = data.name.split(' ')

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
                  width: '45%',
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
                    <text key={word + index}>{word}</text>
                  ))}
                  {data.isVerified && <img src={CHECK_URL} height="54px" />}
                </div>
                <img src={WATERMARK_URL} alt="Uniswap" height="72px" width="324px" />
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
    ) as Response
  } catch (error: any) {
    return new Response(error.message || error.toString(), { status: 500 })
  }
}
