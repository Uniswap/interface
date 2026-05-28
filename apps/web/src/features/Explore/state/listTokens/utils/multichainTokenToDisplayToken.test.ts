import { ChainToken, MultichainToken, TokenStats, TokenType } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { createDataApiMultichainToken } from 'uniswap/src/test/fixtures/dataApi/multichainToken'
import { describe, expect, it, vi } from 'vitest'
import { TimePeriod } from '~/appGraphql/data/util'
import { multichainTokenToDisplayToken } from '~/features/Explore/state/listTokens/utils/multichainTokenToDisplayToken'

vi.mock('uniswap/src/features/chains/utils', () => ({
  toGraphQLChain: vi.fn(),
}))

const mockToGraphQLChain = vi.mocked(toGraphQLChain)

describe('multichainTokenToDisplayToken', () => {
  it('should return undefined when chainTokens is empty (e.g. protobuf default)', () => {
    const mc = new MultichainToken({
      multichainId: 'mc:1_0xABC',
      symbol: 'USDC',
      name: 'USD Coin',
      type: TokenType.ERC20,
      projectName: '',
      logoUrl: '',
      safetyLevel: 1,
      spamCode: 0,
      chainTokens: [],
    })
    expect(multichainTokenToDisplayToken({ mcToken: mc })).toBeUndefined()
  })

  beforeEach(() => {
    mockToGraphQLChain.mockImplementation((id: number) => {
      if (id === 1) {
        return 'ethereum' as ReturnType<typeof toGraphQLChain>
      }
      if (id === 8453) {
        return 'base' as ReturnType<typeof toGraphQLChain>
      }
      return 'ethereum' as ReturnType<typeof toGraphQLChain>
    })
  })

  it('should map multichain token to display token with id as multichainId', () => {
    const mc = createDataApiMultichainToken({
      multichainId: 'mc:1_0xABC',
      symbol: 'USDC',
      name: 'USD Coin',
    })

    const result = multichainTokenToDisplayToken({ mcToken: mc })!

    expect(result.id).toBe('mc:1_0xABC')
    expect(mockToGraphQLChain).toHaveBeenCalledWith(1)
  })

  it('should use first chainToken for chain, address, and decimals', () => {
    const mc = createDataApiMultichainToken({
      chainId: 8453,
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      decimals: 6,
    })

    const result = multichainTokenToDisplayToken({ mcToken: mc })!

    expect(mockToGraphQLChain).toHaveBeenCalledWith(8453)
    expect(result.chain).toBe('base')
    expect(result.address).toBe('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913')
    expect(result.decimals).toBe(6)
  })

  it('should prefer chainToken matching explore network filter when present', () => {
    const mc = new MultichainToken({
      multichainId: 'mc:multi',
      symbol: 'USDC',
      name: 'USD Coin',
      type: TokenType.ERC20,
      projectName: 'Circle',
      logoUrl: '',
      safetyLevel: 0,
      spamCode: 0,
      chainTokens: [
        new ChainToken({
          chainId: 1,
          address: '0xEthFirst',
          decimals: 6,
          isBridged: false,
        }),
        new ChainToken({
          chainId: 8453,
          address: '0xBaseAddr',
          decimals: 6,
          isBridged: false,
        }),
      ],
    })

    const result = multichainTokenToDisplayToken({
      mcToken: mc,
      filterTimePeriod: TimePeriod.DAY,
      exploreChainId: UniverseChainId.Base,
    })!

    expect(mockToGraphQLChain).toHaveBeenCalledWith(8453)
    expect(result.chain).toBe('base')
    expect(result.address).toBe('0xBaseAddr')
  })

  it('should return undefined when exploreChainId has no matching chainToken', () => {
    const mc = new MultichainToken({
      multichainId: 'mc:multi',
      symbol: 'ONLY_ETH',
      name: 'Eth Only',
      type: TokenType.ERC20,
      projectName: '',
      logoUrl: '',
      safetyLevel: 0,
      spamCode: 0,
      chainTokens: [
        new ChainToken({
          chainId: 1,
          address: '0xEthOnly',
          decimals: 18,
          isBridged: false,
        }),
      ],
    })

    expect(
      multichainTokenToDisplayToken({
        mcToken: mc,
        exploreChainId: UniverseChainId.Base,
      }),
    ).toBeUndefined()
  })

  it('should map name, symbol, logo from multichain token', () => {
    const mc = createDataApiMultichainToken({
      name: 'Wrapped Ether',
      symbol: 'WETH',
      logoUrl: 'https://example.com/weth.png',
    })

    const result = multichainTokenToDisplayToken({ mcToken: mc })!

    expect(result.name).toBe('Wrapped Ether')
    expect(result.symbol).toBe('WETH')
    expect(result.logo).toBe('https://example.com/weth.png')
  })

  it('should map stats when present', () => {
    const mc = createDataApiMultichainToken({
      price: 2.5,
      fdv: 100_000_000,
      priceChange1h: 0.5,
      priceChange1d: -1.2,
      volume1d: 5_000_000,
    })

    const result = multichainTokenToDisplayToken({ mcToken: mc })!

    expect(result.price?.value).toBe(2.5)
    expect(result.fullyDilutedValuation?.value).toBe(100_000_000)
    expect(result.pricePercentChange1Hour?.value).toBe(0.5)
    expect(result.pricePercentChange1Day?.value).toBe(-1.2)
    expect(result.volume?.value).toBe(5_000_000)
  })

  it('should omit optional stats when undefined', () => {
    const mc = new MultichainToken({
      multichainId: 'mc:1_0xNoStats',
      symbol: 'X',
      name: 'No Stats',
      type: TokenType.ERC20,
      projectName: '',
      logoUrl: '',
      safetyLevel: 0,
      spamCode: 0,
      chainTokens: [new ChainToken({ chainId: 1, address: '0xNoStats', decimals: 18, isBridged: false })],
    })

    const result = multichainTokenToDisplayToken({ mcToken: mc })!

    expect(result.price).toBeUndefined()
    expect(result.fullyDilutedValuation).toBeUndefined()
    expect(result.pricePercentChange1Hour).toBeUndefined()
    expect(result.pricePercentChange1Day).toBeUndefined()
    expect(result.volume).toBeUndefined()
  })

  it('should map project with name, logo, safetyLevel (data-api enum → GraphQL), and isSpam', () => {
    const mc = createDataApiMultichainToken({
      projectName: 'Circle',
      logoUrl: 'https://example.com/logo.png',
      safetyLevel: 2, // MEDIUM_WARNING in data-api
      spamCode: 1,
    })

    const result = multichainTokenToDisplayToken({ mcToken: mc })!

    expect(result.project?.name).toBe('Circle')
    expect(result.project?.logo?.url).toBe('https://example.com/logo.png')
    expect(result.project?.safetyLevel).toBe(GraphQLApi.SafetyLevel.MediumWarning)
    expect(result.project?.isSpam).toBe(true)
  })

  it('should set project.logo undefined when logoUrl is empty', () => {
    const mc = createDataApiMultichainToken({ logoUrl: '' })

    const result = multichainTokenToDisplayToken({ mcToken: mc })!

    expect(result.project?.logo).toBeUndefined()
  })

  it('should set isSpam false when spamCode is 0', () => {
    const mc = createDataApiMultichainToken({ spamCode: 0 })

    const result = multichainTokenToDisplayToken({ mcToken: mc })!

    expect(result.project?.isSpam).toBe(false)
  })

  it('should use volume for selected filterTimePeriod when present (e.g. volume7d for WEEK)', () => {
    const chainToken = new ChainToken({
      chainId: 1,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      isBridged: false,
    })
    const stats = new TokenStats({
      price: 1,
      volume1d: 1_000_000,
      volume7d: 5_000_000,
    })
    const mc = new MultichainToken({
      multichainId: 'mc:1_0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      type: TokenType.ERC20,
      projectName: 'Circle',
      logoUrl: '',
      safetyLevel: 0,
      spamCode: 0,
      stats,
      chainTokens: [chainToken],
    })

    expect(multichainTokenToDisplayToken({ mcToken: mc, filterTimePeriod: TimePeriod.DAY })!.volume?.value).toBe(
      1_000_000,
    )
    expect(multichainTokenToDisplayToken({ mcToken: mc, filterTimePeriod: TimePeriod.WEEK })!.volume?.value).toBe(
      5_000_000,
    )
  })
})
