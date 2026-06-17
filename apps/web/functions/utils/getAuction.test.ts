import getAuction from 'functions/utils/getAuction'

function mockAuctionResponse(auction: Record<string, unknown>): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ auctions: [auction] }), { status: 200 })),
  )
}

describe('getAuction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('formats auction metadata from the auction API response', async () => {
    mockAuctionResponse({
      tokenAddress: '0x1234567890123456789012345678901234567890',
      tokenName: 'Example Token',
      tokenSymbol: 'EXM',
      currencyTokenSymbol: 'USDC',
    })

    const result = await getAuction({
      chainName: 'base',
      auctionAddress: '0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD',
      url: 'https://app.uniswap.org/explore/auctions/base/0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD',
    })

    expect(fetch).toHaveBeenCalledWith(
      'https://entry-gateway.backend-prod.api.uniswap.org/data.v1.AuctionService/GetAuction',
      expect.objectContaining({
        body: JSON.stringify({
          chainId: 8453,
          address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        }),
      }),
    )
    expect(result).toEqual({
      title: 'Bid on EXM on Uniswap',
      image: 'https://app.uniswap.org/api/image/auctions/base/0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD',
      url: 'https://app.uniswap.org/explore/auctions/base/0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD',
      description: 'Bid on Example Token in a Uniswap token auction.',
      name: 'Example Token',
      auctionData: {
        tokenName: 'Example Token',
        tokenSymbol: 'EXM',
        tokenLogoUrl: undefined,
        currencySymbol: 'USDC',
      },
    })
  })

  test('uses auction metadata overrides when configured', async () => {
    mockAuctionResponse({
      tokenAddress: '0xa53887f7e7c1bf5010b8627f1c1ba94fe7a5d6e0',
      tokenName: 'Rainbow Token',
      tokenSymbol: 'RNBW',
    })

    const result = await getAuction({
      chainName: 'base',
      auctionAddress: '0x7e867b47a94df05188c08575e8b9a52f3f69c469',
      url: 'https://app.uniswap.org/explore/auctions/base/0x7e867b47a94df05188c08575e8b9a52f3f69c469',
    })

    expect(result?.auctionData?.tokenLogoUrl).toBe('https://app.uniswap.org/images/logos/rainbow-token-launch-logo.png')
  })

  test('returns undefined for invalid chain URL params', async () => {
    vi.stubGlobal('fetch', vi.fn())

    const result = await getAuction({
      chainName: 'invalid',
      auctionAddress: '0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD',
      url: 'https://app.uniswap.org/explore/auctions/invalid/0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD',
    })

    expect(result).toBeUndefined()
    expect(fetch).not.toHaveBeenCalled()
  })
})
