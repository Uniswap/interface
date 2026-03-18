// biome-ignore-all lint/correctness/noRestrictedElements: ignoring for the whole file

import { ImageResponse } from '@vercel/og'
import { WATERMARK_URL } from 'functions/constants'
import getFont from 'functions/utils/getFont'
import getNetworkLogoUrl from 'functions/utils/getNetworkLogoURL'
import { getRequest } from 'functions/utils/getRequest'
import { getRGBColor } from 'functions/utils/getRGBColor'
import getToken from 'functions/utils/getToken'
import { Context } from 'hono'

export async function tokenImageHandler(c: Context) {
  try {
    const { networkName, tokenAddress } = c.req.param()
    const origin = new URL(c.req.url).origin

    const cacheUrl = origin + '/tokens/' + networkName + '/' + tokenAddress
    const data = await getRequest({
      url: cacheUrl,
      getData: () => getToken({ networkName, tokenAddress, url: cacheUrl }),
      validateData: (data): data is NonNullable<Awaited<ReturnType<typeof getToken>>> =>
        Boolean(data.tokenData?.symbol && data.name),
    })

    if (!data) {
      return new Response('Token not found.', { status: 404 })
    }

    const [fontData, palette] = await Promise.all([getFont(origin, c.env), getRGBColor(data.ogImage, true)])

    const networkLogo = getNetworkLogoUrl(networkName.toUpperCase(), origin)

    // ImageResponse cannot handle webp images: https://github.com/vercel/satori/issues/273#issuecomment-1296323042
    // TODO: remove this check logic once @vercel/og supports webp, which appears to be in-progress https://github.com/vercel/satori/pull/622
    const ogImage = data.ogImage?.includes('.webp') ? undefined : data.ogImage

    return new ImageResponse(
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
            backgroundColor: `rgba(${palette.red}, ${palette.green}, ${palette.blue})`,
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
            {ogImage ? (
              <img src={ogImage} width="144px" height="144px" style={{ borderRadius: '100%' }}>
                {networkLogo !== '' && (
                  <img
                    src={networkLogo}
                    width="48px"
                    height="48px"
                    style={{
                      position: 'absolute',
                      right: '2px',
                      bottom: '0px',
                    }}
                  />
                )}
              </img>
            ) : (
              <div
                style={{
                  width: '144px',
                  height: '144px',
                  borderRadius: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontSize: '48px',
                    lineHeight: '58px',
                    color: 'white',
                  }}
                >
                  {data.name?.slice(0, 3).toUpperCase()}
                </div>
                {networkLogo !== '' && (
                  <img
                    src={networkLogo}
                    width="48px"
                    height="48px"
                    style={{
                      position: 'absolute',
                      right: '2px',
                      bottom: '0px',
                    }}
                  />
                )}
              </div>
            )}
            <div
              style={{
                fontFamily: 'Inter',
                fontSize: '72px',
                lineHeight: '72px',
                marginLeft: '-5px',
                marginTop: '24px',
              }}
            >
              {data.name}
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
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%',
                }}
              >
                {data.tokenData?.symbol}
              </div>
              <img src={WATERMARK_URL} alt="Uniswap" height="72px" width="324px" />
            </div>
          </div>
        </div>
      </div>,
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
