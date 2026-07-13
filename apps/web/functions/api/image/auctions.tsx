/* oxlint-disable react/forbid-elements -- ignoring for the whole file */

import { ImageResponse } from '@vercel/og'
import { IMAGE_DATA_FETCH_TIMEOUT_MS, WATERMARK_URL } from 'functions/constants'
import getAuction from 'functions/utils/getAuction'
import getFont from 'functions/utils/getFont'
import getNetworkLogoUrl from 'functions/utils/getNetworkLogoURL'
import { getRequest } from 'functions/utils/getRequest'
import { Context } from 'hono'
import { withTimeout } from 'uniswap/src/utils/polling'

function AuctionTokenLogo({
  logoUrl,
  symbol,
  networkLogo,
}: {
  logoUrl?: string
  symbol: string
  networkLogo: string
}): JSX.Element {
  const fallbackSymbol = symbol.slice(0, 3).toUpperCase() || 'TOK'

  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: '168px',
        height: '168px',
      }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          width="168px"
          height="168px"
          style={{
            borderRadius: '48px',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            width: '168px',
            height: '168px',
            borderRadius: '48px',
            backgroundColor: '#FC72FF',
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
            {fallbackSymbol}
          </div>
        </div>
      )}
      {networkLogo !== '' && (
        <img
          src={networkLogo}
          width="48px"
          height="48px"
          style={{
            position: 'absolute',
            right: '-2px',
            bottom: '-2px',
            borderRadius: '14px',
            objectFit: 'cover',
          }}
        />
      )}
    </div>
  )
}

export async function auctionImageHandler(c: Context) {
  try {
    const { chainName, auctionAddress } = c.req.param()
    const origin = new URL(c.req.url).origin
    const cacheUrl = origin + '/auctions/' + chainName + '/' + auctionAddress
    const data = await withTimeout(
      getRequest({
        url: cacheUrl,
        getData: () => getAuction({ chainName, auctionAddress, url: cacheUrl }),
        validateData: (data): data is NonNullable<Awaited<ReturnType<typeof getAuction>>> =>
          Boolean(data.auctionData?.tokenSymbol && data.name),
      }),
      { timeoutMs: IMAGE_DATA_FETCH_TIMEOUT_MS, errorMsg: 'auctionImageHandler getAuction timeout' },
    ).catch(() => null)

    if (!data) {
      return new Response('Auction not found.', { status: 404 })
    }

    const [fontData] = await Promise.all([getFont(origin, c.env)])
    const networkLogo = getNetworkLogoUrl(chainName.toUpperCase(), origin)
    const logoUrl = data.auctionData?.tokenLogoUrl?.includes('.webp') ? undefined : data.auctionData?.tokenLogoUrl
    const tokenName = data.auctionData?.tokenName ?? data.name
    const tokenSymbol = data.auctionData?.tokenSymbol ?? 'TOKEN'

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
            <AuctionTokenLogo logoUrl={logoUrl} symbol={tokenSymbol} networkLogo={networkLogo} />
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
              <div
                style={{
                  fontFamily: 'Inter',
                  fontSize: '112px',
                  lineHeight: '120px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%',
                }}
              >
                {tokenName}
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
                    color: '#9B9B9B',
                  }}
                >
                  Token auction
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
  } catch {
    return new Response('Internal error', { status: 500 })
  }
}
