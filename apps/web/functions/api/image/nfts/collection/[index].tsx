/* eslint-disable react/forbid-elements */
import { ImageResponse } from '@vercel/og'

import { getDynamicBlocklistedNftCollections } from '../../../../../src/nft/utils/blocklist'
import { CHECK_URL, WATERMARK_URL } from '../../../../constants'
import getCollection from '../../../../utils/getCollection'
import getFont from '../../../../utils/getFont'
import { getRGBColor } from '../../../../utils/getRGBColor'
import { getRequest } from '../../../../utils/getRequest'

export const onRequest: PagesFunction = async ({ params, request }) => {
  try {
    const blocklistedCollections = await getDynamicBlocklistedNftCollections()
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
        Boolean(data.ogImage && data.name && data.nftCollectionData?.isVerified),
    )

    if (!data) {
      return new Response('Collection not found.', { status: 404 })
    }

    const [fontData, palette] = await Promise.all([getFont(origin), getRGBColor(data.ogImage)])

    // Split name into words to wrap them since satori does not support inline text wrapping
    const words = data.name?.split(' ')

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
              backgroundColor: `rgba(${palette.red}, ${palette.green}, ${palette.blue}, 0.75)`,
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
                  {words && words.map((word: string) => <text key={word + index}>{word}</text>)}
                  {data.nftCollectionData?.isVerified && <img src={CHECK_URL} height="54px" />}
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
      },
    ) as Response
  } catch (error: any) {
    return new Response(error.message || error.toString(), { status: 500 })
  }
}
