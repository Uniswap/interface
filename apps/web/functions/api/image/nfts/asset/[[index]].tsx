/* eslint-disable import/no-unused-modules */
import { ImageResponse } from '@vercel/og'

import { blocklistedCollections } from '../../../../../src/nft/utils/blocklist'
import { WATERMARK_URL } from '../../../../constants'
import getAsset from '../../../../utils/getAsset'
import getFont from '../../../../utils/getFont'
import { getRequest } from '../../../../utils/getRequest'

export const onRequest: PagesFunction = async ({ params, request }) => {
  try {
    const origin = new URL(request.url).origin
    const { index } = params
    const collectionAddress = index[0]?.toString()
    const tokenId = index[1]?.toString()
    const cacheUrl = origin + '/nfts/asset/' + collectionAddress + '/' + tokenId

    if (blocklistedCollections.includes(collectionAddress)) {
      return new Response('Collection unsupported.', { status: 404 })
    }

    const data = await getRequest(
      cacheUrl,
      () => getAsset(collectionAddress, tokenId, cacheUrl),
      (data): data is NonNullable<Awaited<ReturnType<typeof getAsset>>> => Boolean(data.ogImage)
    )

    if (!data) {
      return new Response('Asset not found.', { status: 404 })
    }

    const fontData = await getFont(origin)

    return new ImageResponse(
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
