import { IssuerMultichainToken, ListRwaTokensResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { mapRwaToken, mapRwaTokenList } from 'uniswap/src/data/rest/rwa/mapRwaToken'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

describe('mapRwaToken', () => {
  it('maps flat issuer-token fields for commodities rows', () => {
    const rwa = mapRwaToken(
      new IssuerMultichainToken({
        symbol: 'XAUT',
        name: 'Tether Gold',
        logoUrl: 'https://example.com/xaut.png',
        priceUsd: 4323.78,
        volume24hUsd: 183_999_147,
        marketCapUsd: 2_648_607_827,
        priceChange24hPct: 1.0,
        chainTokens: [{ chainId: UniverseChainId.Mainnet, address: '0x68749665ff8d2d112fa859aa293f07a622782f38' }],
      }),
    )

    expect(rwa).toMatchObject({
      symbol: 'XAUT',
      name: 'Tether Gold',
      priceUsd: 4323.78,
      issuerTokens: [
        expect.objectContaining({
          symbol: 'XAUT',
          name: 'Tether Gold',
          chainTokens: [{ chainId: UniverseChainId.Mainnet, address: '0x68749665ff8d2d112fa859aa293f07a622782f38' }],
        }),
      ],
    })
  })

  it('returns null when no chain tokens are present', () => {
    expect(
      mapRwaToken(
        new IssuerMultichainToken({
          symbol: 'XAUT',
          name: 'Tether Gold',
          chainTokens: [],
        }),
      ),
    ).toBeNull()
  })
})

describe('mapRwaTokenList', () => {
  it('maps all tokens from the response', () => {
    const response = new ListRwaTokensResponse({
      tokens: [
        new IssuerMultichainToken({
          symbol: 'XAUT',
          name: 'Tether Gold',
          chainTokens: [{ chainId: UniverseChainId.Mainnet, address: '0x1' }],
        }),
        new IssuerMultichainToken({
          symbol: 'PAXG',
          name: 'PAX Gold',
          chainTokens: [{ chainId: UniverseChainId.Mainnet, address: '0x2' }],
        }),
      ],
    })

    const rows = mapRwaTokenList(response)
    expect(rows).toHaveLength(2)
    expect(rows.map((row) => row.symbol)).toEqual(['XAUT', 'PAXG'])
  })
})
