import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
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

  it('logs an error when a non-empty issuer token has no issuerData entry', () => {
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
      expect.objectContaining({
        tags: { file: 'resolveRwaIssuerDisplay.ts', function: 'resolveRwaIssuerDisplay' },
      }),
    )
  })

  it('carries the asset display category resolved from `categories`', () => {
    const whitelist = toRWAWhitelistFromDataApi([
      {
        symbol: 'GOOGL',
        name: 'GOOGL',
        logoUrl: 'https://example.com/googl.png',
        categories: [RwaCategory.STOCKS],
        issuerTokens: [{ chainId: MAINNET_CHAIN_ID, address: '0xondo', issuer: 'ondo' }],
        issuerData: {
          ondo: { name: 'Ondo', symbol: 'GOOGL.on', logoUrl: 'https://example.com/ondo.png' },
        },
      },
    ])

    expect(whitelist[0]?.category).toBe(RwaCategory.STOCKS)
  })

  it('defaults category to UNSPECIFIED when `categories` is absent', () => {
    const whitelist = toRWAWhitelistFromDataApi([
      {
        symbol: 'GOOGL',
        name: 'GOOGL',
        logoUrl: 'https://example.com/googl.png',
        issuerTokens: [{ chainId: MAINNET_CHAIN_ID, address: '0xondo', issuer: 'ondo' }],
        issuerData: {
          ondo: { name: 'Ondo', symbol: 'GOOGL.on', logoUrl: 'https://example.com/ondo.png' },
        },
      },
    ])

    expect(whitelist[0]?.category).toBe(RwaCategory.UNSPECIFIED)
  })

  it('uses asset-level display for an empty-issuer token without logging or dropping it', () => {
    const whitelist = toRWAWhitelistFromDataApi([
      {
        symbol: 'GOLD',
        name: 'Gold',
        logoUrl: 'https://example.com/gold.png',
        issuerTokens: [{ chainId: MAINNET_CHAIN_ID, address: '0xgold', issuer: '' }],
        issuerData: {},
      },
    ])

    expect(whitelist[0]?.tokens).toEqual([
      {
        chainId: MAINNET_CHAIN_ID,
        address: '0xgold',
        issuer: 'unknown',
        name: 'Gold',
        symbol: 'GOLD',
        logoUrl: 'https://example.com/gold.png',
      },
    ])
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('carries network count for preferred issuer tokens', () => {
    const whitelist = toRWAWhitelistFromDataApi([
      {
        symbol: 'GOOGL',
        name: 'GOOGL',
        logoUrl: 'https://example.com/googl.png',
        issuerTokens: [
          { chainId: 56, address: '0xondo-bnb', issuer: 'ondo' },
          { chainId: MAINNET_CHAIN_ID, address: '0xondo-mainnet', issuer: 'ondo' },
        ],
        issuerData: {
          ondo: { name: 'Ondo', symbol: 'GOOGL.on', logoUrl: 'https://example.com/ondo.png' },
        },
      },
    ])

    expect(whitelist[0]?.tokens).toEqual([
      {
        chainId: MAINNET_CHAIN_ID,
        address: '0xondo-mainnet',
        issuer: 'ondo',
        networkCount: 2,
        name: 'Ondo',
        symbol: 'GOOGL.on',
        logoUrl: 'https://example.com/ondo.png',
      },
    ])
  })
})
