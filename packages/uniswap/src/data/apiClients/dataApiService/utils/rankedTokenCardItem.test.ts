import { TimestampedValue } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { ChainTokenRankStats, TokenIssuerInfo, TokenRankStats } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { rankedTokenToCardItem } from 'uniswap/src/data/apiClients/dataApiService/utils/rankedTokenCardItem'
import { createRankedMultichainToken } from 'uniswap/src/test/fixtures/dataApi/rankedMultichainToken'

const UNI_MAINNET = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
const UNI_OPTIMISM = '0x6fd9d7AD17242c41f7131d257212c54A0e816691'

describe(rankedTokenToCardItem, () => {
  it('flattens a ranked token into a card item with its sparkline', () => {
    const token = createRankedMultichainToken({
      address: UNI_MAINNET,
      symbol: 'UNI',
      name: 'Uniswap',
      logoUrl: 'https://example.com/uni.png',
      price: 11.42,
      priceChange1d: 8.6,
    })
    token.sparkline = [
      new TimestampedValue({ timestamp: BigInt(1_754_300_000), value: 10 }),
      new TimestampedValue({ timestamp: BigInt(1_754_304_320), value: 11.42 }),
    ]

    expect(rankedTokenToCardItem(token)).toMatchObject({
      chainId: 1,
      address: UNI_MAINNET,
      name: 'Uniswap',
      symbol: 'UNI',
      logoUrl: 'https://example.com/uni.png',
      priceUsd: 11.42,
      pricePercentChange1d: 8.6,
      sparkline: [
        { timestamp: 1_754_300_000, value: 10 },
        { timestamp: 1_754_304_320, value: 11.42 },
      ],
    })
  })

  it('carries backend issuer branding for tokenized RWAs', () => {
    const token = createRankedMultichainToken({ address: UNI_MAINNET, symbol: 'TSLAon' })
    token.multichainToken!.issuer = new TokenIssuerInfo({
      id: 'Ondo',
      displayName: 'Ondo',
      logoUrl: 'https://example.com/ondo.png',
    })

    expect(rankedTokenToCardItem(token)?.issuer).toEqual({
      issuer: 'ondo',
      issuerDisplayName: 'Ondo',
      issuerLogoUrl: 'https://example.com/ondo.png',
    })
  })

  it('leaves issuer unset for ordinary tokens', () => {
    expect(rankedTokenToCardItem(createRankedMultichainToken({ address: UNI_MAINNET }))?.issuer).toBeUndefined()
  })

  it('returns undefined when the token has no deployments', () => {
    expect(rankedTokenToCardItem(createRankedMultichainToken({ addresses: {} }))).toBeUndefined()
  })

  it('picks the primary deployment by highest 1d volume', () => {
    const token = createRankedMultichainToken({
      addresses: { '1': UNI_MAINNET, '10': UNI_OPTIMISM },
      chainStats: [
        new ChainTokenRankStats({ chainId: 1, stats: new TokenRankStats({ volume1d: 1_000 }) }),
        new ChainTokenRankStats({ chainId: 10, stats: new TokenRankStats({ volume1d: 5_000 }) }),
      ],
    })

    const card = rankedTokenToCardItem(token)
    expect(card?.chainId).toBe(10)
    expect(card?.address).toBe(UNI_OPTIMISM)
    expect(card?.isMultichain).toBe(true)
  })

  it('marks a single-deployment token as not multichain', () => {
    expect(rankedTokenToCardItem(createRankedMultichainToken({ address: UNI_MAINNET }))?.isMultichain).toBe(false)
  })

  it('drops deployments on unsupported chains', () => {
    const unsupportedOnly = createRankedMultichainToken({ addresses: { '999999': UNI_MAINNET } })
    expect(rankedTokenToCardItem(unsupportedOnly)).toBeUndefined()

    const mixed = createRankedMultichainToken({ addresses: { '999999': UNI_OPTIMISM, '1': UNI_MAINNET } })
    const mixedCard = rankedTokenToCardItem(mixed)
    expect(mixedCard?.chainId).toBe(1)
    expect(mixedCard?.isMultichain).toBe(false)
  })
})
