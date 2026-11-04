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

  test('serves the API token image, resolving ipfs:// through the IPFS gateway', async () => {
    mockAuctionResponse({
      tokenAddress: '0x170f6e39ea851108f0713090467871f28a62a5d4',
      tokenName: 'Boardwalk',
      tokenSymbol: 'BWLK',
      tokenImageUrl: 'ipfs://bafkreiacndnz2tlxmvv4jl7bkl2moqr62vzbfzibcmlm2vsmt7ojjxudp4',
    })

    const result = await getAuction({
      chainName: 'arbitrum',
      auctionAddress: '0x54114F746B55b2f8A56bbd17dfD9e81a0a71d366',
      url: 'https://app.uniswap.org/explore/auctions/arbitrum/0x54114F746B55b2f8A56bbd17dfD9e81a0a71d366',
    })

    expect(result?.auctionData?.tokenLogoUrl).toBe(
      'https://ipfs.pools.xyz/ipfs/bafkreiacndnz2tlxmvv4jl7bkl2moqr62vzbfzibcmlm2vsmt7ojjxudp4',
    )
  })

  test('passes an https API token image through unchanged', async () => {
    mockAuctionResponse({
      tokenAddress: '0x1234567890123456789012345678901234567890',
      tokenSymbol: 'EXM',
      tokenImageUrl: 'https://coin-images.coingecko.com/coins/images/1/large/exm.png',
    })

    const result = await getAuction({
      chainName: 'base',
      auctionAddress: '0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD',
      url: 'https://app.uniswap.org/explore/auctions/base/0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD',
    })

    expect(result?.auctionData?.tokenLogoUrl).toBe('https://coin-images.coingecko.com/coins/images/1/large/exm.png')
  })

  test.each(['data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', 'http://example.com/exm.png', 'javascript:alert(1)'])(
    'drops an API token image that is not https or ipfs: %s',
    async (tokenImageUrl) => {
      mockAuctionResponse({
        tokenAddress: '0x1234567890123456789012345678901234567890',
        tokenSymbol: 'EXM',
        tokenImageUrl,
      })

      const result = await getAuction({
        chainName: 'base',
        auctionAddress: '0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD',
        url: 'https://app.uniswap.org/explore/auctions/base/0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD',
      })

      expect(result?.auctionData?.tokenLogoUrl).toBeUndefined()
    },
  )

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
