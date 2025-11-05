// biome-ignore-all lint/correctness/noRestrictedElements: ignoring for the whole file

import * as GraphQLApi from '@universe/api/src/clients/graphql/__generated__/types-and-hooks'
import { ImageResponse } from '@vercel/og'
import { WATERMARK_URL } from 'functions/constants'
import getFont from 'functions/utils/getFont'
import getNetworkLogoUrl from 'functions/utils/getNetworkLogoURL'
import getPool from 'functions/utils/getPool'
import { getRequest } from 'functions/utils/getRequest'
import { Context } from 'hono'

function UnknownTokenImage({ symbol }: { symbol?: string }) {
  const ticker = symbol?.slice(0, 3)
  return (
    <div
      style={{
        fontFamily: 'Inter',
        fontSize: '32px',
        color: 'white',
        width: '84px',
        height: '168px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '168px 0 0 168px',
        borderRight: '4px solid #1B1B1B',
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)',
      }}
    >
      {ticker ?? 'UNK'}
    </div>
  )
}

function PoolImage({
  token0ImageUrl,
  token1ImageUrl,
  tokenSymbol0,
  tokenSymbol1,
  children,
}: {
  token0ImageUrl?: string
  token1ImageUrl?: string
  tokenSymbol0?: string
  tokenSymbol1?: string
  children?: React.ReactNode
}) {
  // ImageResponse cannot handle webp images: https://github.com/vercel/satori/issues/273#issuecomment-1296323042
  // TODO: remove this check logic once @vercel/og supports webp, which appears to be in-progress https://github.com/vercel/satori/pull/622
  const token0Image = token0ImageUrl?.includes('.webp') ? undefined : token0ImageUrl
  const token1Image = token1ImageUrl?.includes('.webp') ? undefined : token1ImageUrl

  return (
    <div
      style={{
        display: 'flex',
        width: '168px',
        height: '168px',
        position: 'relative',
      }}
    >
      {token0Image ? (
        <div
          style={{
            width: '84px',
            height: '168px',
            backgroundImage: `url(${token0Image})`,
            backgroundSize: '200% 100%',
            borderRadius: '168px 0 0 168px',
            borderRight: '4px solid #1B1B1B', // Border on the right edge of the first image
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)', // Clips to the left half
          }}
        />
      ) : (
        <UnknownTokenImage symbol={tokenSymbol0} />
      )}
      {token1Image ? (
        <div
          style={{
            width: '84px',
            height: '168px',
            backgroundImage: `url(${token1Image})`,
            backgroundPosition: '100% 0%',
            backgroundSize: '200% 100%',
            borderRadius: '0 168px 168px 0',
            borderLeft: '4px solid #1B1B1B', // Border on the left edge of the second image
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)', // Clips to the right half
          }}
        />
      ) : (
        <UnknownTokenImage symbol={tokenSymbol1} />
      )}
      {children}
    </div>
  )
}

export async function poolImageHandler(c: Context) {
  try {
    const { networkName, poolAddress } = c.req.param()
    const origin = new URL(c.req.url).origin

    const cacheUrl = origin + '/pools/' + networkName + '/' + poolAddress
    const data = await getRequest({
      url: cacheUrl,
      getData: () => getPool({ networkName, poolAddress, url: cacheUrl }),
      validateData: (data): data is NonNullable<Awaited<ReturnType<typeof getPool>>> => Boolean(data.title),
    })

    if (!data) {
      return new Response('Pool not found.', { status: 404 })
    }

    const [fontData] = await Promise.all([getFont(origin, c.env)])
    const networkLogo = getNetworkLogoUrl(networkName.toUpperCase(), origin)

    return new ImageResponse(
      <div
        style={{
          backgroundColor: '#1B1B1B',
          display: 'flex',
          width: '1200px',
          height: '630px',
        }}
      >
        <div
          style={{
            display: 'flex',
            backgroundColor: `#1B1B1B`,
            alignItems: 'center',
            height: '100%',
            padding: '96px',
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
              gap: '54px',
            }}
          >
            <PoolImage
              token0ImageUrl={data.poolData?.token0Image}
              token1ImageUrl={data.poolData?.token1Image}
              tokenSymbol0={data.poolData?.token0Symbol}
              tokenSymbol1={data.poolData?.token1Symbol}
            >
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
            </PoolImage>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: '24px' }}>
                <div
                  style={{
                    fontFamily: 'Inter',
                    fontSize: '100px',
                    lineHeight: '120px',
                  }}
                >
                  {data.name}
                </div>
                {data.poolData?.protocolVersion === GraphQLApi.ProtocolVersion.V2 && (
                  <div
                    style={{
                      fontFamily: 'Inter',
                      fontSize: '48px',
                      lineHeight: '48px',
                      backgroundColor: '#FFFFFF12',
                      borderRadius: '24px',
                      padding: '12px 20px',
                      color: '#9B9B9B',
                      alignSelf: 'center',
                    }}
                  >
                    {data.poolData?.protocolVersion}
                  </div>
                )}
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
                    fontSize: '72px',
                    lineHeight: '72px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    color: '#9B9B9B',
                  }}
                >
                  {data.poolData?.feeTier}
                </div>
                <img src={WATERMARK_URL} alt="Uniswap" height="72px" width="324px" />
              </div>
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
