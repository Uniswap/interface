import { toRWAWhitelistFromDataApi } from 'uniswap/src/features/rwa/useRWAWhitelist'
import { logger } from 'utilities/src/logger/logger'

const MAINNET_CHAIN_ID = 1

describe('toRWAWhitelistFromDataApi', () => {
  beforeEach(() => {
    vi.spyOn(logger, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('maps issuerData onto each token by its issuer', () => {
    const whitelist = toRWAWhitelistFromDataApi([
      {
        symbol: 'GOOGL',
        name: 'GOOGL',
        logoUrl: 'https://example.com/googl.png',
        issuerTokens: [
          { chainId: MAINNET_CHAIN_ID, address: '0xondo', issuer: 'ondo' },
          { chainId: MAINNET_CHAIN_ID, address: '0xxstock', issuer: 'xstock' },
        ],
        issuerData: {
          ondo: { name: 'Ondo', symbol: 'GOOGL.on', logoUrl: 'https://example.com/ondo.png' },
          xstock: { name: 'XStock', symbol: 'GOOGL.X', logoUrl: 'https://example.com/xstock.png' },
        },
      },
    ])

    expect(whitelist[0]?.tokens).toEqual([
      {
        chainId: MAINNET_CHAIN_ID,
        address: '0xondo',
        issuer: 'ondo',
        name: 'Ondo',
        symbol: 'GOOGL.on',
        logoUrl: 'https://example.com/ondo.png',
      },
      {
        chainId: MAINNET_CHAIN_ID,
        address: '0xxstock',
        issuer: 'xstock',
        name: 'XStock',
        symbol: 'GOOGL.X',
        logoUrl: 'https://example.com/xstock.png',
      },
    ])
  })

  it('drops tokens whose issuer has no issuerData entry', () => {
    const whitelist = toRWAWhitelistFromDataApi([
      {
        symbol: 'GOOGL',
        name: 'GOOGL',
        logoUrl: 'https://example.com/googl.png',
        issuerTokens: [
          { chainId: MAINNET_CHAIN_ID, address: '0xondo', issuer: 'ondo' },
          { chainId: MAINNET_CHAIN_ID, address: '0xunknown', issuer: 'unknown-issuer' },
        ],
        issuerData: {
          ondo: { name: 'Ondo', symbol: 'GOOGL.on', logoUrl: 'https://example.com/ondo.png' },
        },
      },
    ])

    expect(whitelist[0]?.tokens).toEqual([
      {
        chainId: MAINNET_CHAIN_ID,
        address: '0xondo',
        issuer: 'ondo',
        name: 'Ondo',
        symbol: 'GOOGL.on',
        logoUrl: 'https://example.com/ondo.png',
      },
    ])
  })

  it('excludes an asset when none of its tokens have an issuerData entry', () => {
    const whitelist = toRWAWhitelistFromDataApi([
      {
        symbol: 'GOOGL',
        name: 'GOOGL',
        logoUrl: 'https://example.com/googl.png',
        issuerTokens: [{ chainId: MAINNET_CHAIN_ID, address: '0xondo', issuer: 'ondo' }],
        issuerData: {},
      },
    ])

    expect(whitelist).toEqual([])
  })

  it('logs an error when an issuer token has no issuerData entry', () => {
    toRWAWhitelistFromDataApi([
      {
        symbol: 'GOOGL',
        name: 'GOOGL',
        logoUrl: 'https://example.com/googl.png',
        issuerTokens: [{ chainId: MAINNET_CHAIN_ID, address: '0xunknown', issuer: 'unknown-issuer' }],
        issuerData: {},
      },
    ])

    expect(logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: { file: 'useRWAWhitelist.ts', function: 'toRWAToken' } }),
    )
  })
})
