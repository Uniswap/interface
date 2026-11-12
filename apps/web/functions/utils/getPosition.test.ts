import getPosition from 'functions/utils/getPosition'
import { DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockLiquidityServicePost } = vi.hoisted(() => ({ mockLiquidityServicePost: vi.fn() }))

// Stub only the transport; keep the real formatLiquidityFeeTier so the fee mapping is under test.
vi.mock('functions/utils/liquidityService', async (importActual) => ({
  ...(await importActual<typeof import('functions/utils/liquidityService')>()),
  liquidityServicePost: mockLiquidityServicePost,
}))

const URL_BASE = 'https://app.uniswap.org/positions/v3/ethereum/123'

function position(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    feeTier: 3000,
    status: 'POSITION_STATUS_OPEN',
    tickLower: -100,
    tickUpper: 100,
    currentTick: 0,
    token0Metadata: { symbol: 'WBTC', logoUrl: 'https://logos/wbtc.png' },
    token1Metadata: { symbol: 'WETH', logoUrl: 'https://logos/weth.png' },
    ...overrides,
  }
}

describe('getPosition', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps a v3 position to OG data with in-range status and token logos', async () => {
    mockLiquidityServicePost.mockResolvedValue({ position: position() })

    const result = await getPosition({ version: 'v3', chainName: 'ethereum', identifier: '123', url: URL_BASE })

    // liquidity Protocols enum: V3 = 1
    expect(mockLiquidityServicePost).toHaveBeenCalledWith('GetPosition', { chainId: 1, version: 1, tokenId: '123' })
    expect(result).toEqual({
      title: 'WBTC/WETH on Uniswap',
      image: 'https://app.uniswap.org/api/image/positions/v3/ethereum/123',
      url: URL_BASE,
      name: 'WBTC/WETH',
      positionStatus: 'in_range',
      poolData: {
        baseSymbol: 'WBTC',
        quoteSymbol: 'WETH',
        feeTier: '0.3%',
        protocolVersion: 'V3',
        baseImage: 'https://logos/wbtc.png',
        quoteImage: 'https://logos/weth.png',
      },
    })
  })

  it('derives out_of_range when the current tick is outside the position range', async () => {
    mockLiquidityServicePost.mockResolvedValue({ position: position({ currentTick: 500 }) })

    const result = await getPosition({ version: 'v3', chainName: 'ethereum', identifier: '123', url: URL_BASE })

    expect(result?.positionStatus).toBe('out_of_range')
  })

  it('reports a closed position regardless of ticks', async () => {
    mockLiquidityServicePost.mockResolvedValue({
      position: position({ status: 'POSITION_STATUS_CLOSED', currentTick: 0 }),
    })

    const result = await getPosition({ version: 'v3', chainName: 'ethereum', identifier: '123', url: URL_BASE })

    expect(result?.positionStatus).toBe('closed')
  })

  it('tolerates the short-form status name (e.g. a protobuf-es-serialized cache value)', async () => {
    mockLiquidityServicePost.mockResolvedValue({ position: position({ status: 'CLOSED' }) })

    const result = await getPosition({ version: 'v3', chainName: 'ethereum', identifier: '123', url: URL_BASE })

    expect(result?.positionStatus).toBe('closed')
  })

  // Pins both halves of the transitional fallback: the served flag, and the sentinel comparison that
  // covers a backend not yet serving is_dynamic_fee. Either way the card must not render ~838%.
  it.each([
    ['the served flag', { feeTier: DYNAMIC_FEE_AMOUNT, isDynamicFee: true }],
    ['the sentinel fee alone', { feeTier: DYNAMIC_FEE_AMOUNT }],
  ])('labels a dynamic-fee position from %s', async (_label, overrides) => {
    mockLiquidityServicePost.mockResolvedValue({ position: position(overrides) })

    const result = await getPosition({
      version: 'v4',
      chainName: 'ethereum',
      identifier: '456',
      url: 'https://app.uniswap.org/positions/v4/ethereum/456',
    })

    expect(result?.poolData?.feeTier).toBe('Dynamic')
  })

  it('omits the status badge when the ticks needed to derive range are absent', async () => {
    mockLiquidityServicePost.mockResolvedValue({ position: position({ currentTick: undefined }) })

    const result = await getPosition({ version: 'v3', chainName: 'ethereum', identifier: '123', url: URL_BASE })

    expect(result?.positionStatus).toBeUndefined()
  })

  it('sends the v4 protocol version (Protocols.V4 = 2)', async () => {
    mockLiquidityServicePost.mockResolvedValue({ position: position() })

    const result = await getPosition({
      version: 'v4',
      chainName: 'ethereum',
      identifier: '456',
      url: 'https://app.uniswap.org/positions/v4/ethereum/456',
    })

    expect(mockLiquidityServicePost).toHaveBeenCalledWith('GetPosition', { chainId: 1, version: 2, tokenId: '456' })
    expect(result?.poolData?.protocolVersion).toBe('V4')
  })

  it('delegates a v2 position to the pool lookup (the pair address is the pool)', async () => {
    mockLiquidityServicePost.mockResolvedValue({
      pool: {
        poolIdentifier: '0xpair',
        protocolVersion: 'V2',
        isDynamicFee: false,
        token0Metadata: { symbol: 'DAI', logoUrl: 'https://logos/dai.png' },
        token1Metadata: { symbol: 'MKR', logoUrl: 'https://logos/mkr.png' },
      },
    })

    const result = await getPosition({
      version: 'v2',
      chainName: 'ethereum',
      identifier: '0xPAIR',
      url: 'https://app.uniswap.org/positions/v2/ethereum/0xPAIR',
    })

    // The v2 branch routes through getPool → GetPool, not GetPosition.
    expect(mockLiquidityServicePost).toHaveBeenCalledWith('GetPool', {
      pool: { chainId: 1, addressOrId: '0xPAIR' },
    })
    expect(result?.name).toBe('DAI/MKR')
  })

  it('returns undefined for an invalid network', async () => {
    const result = await getPosition({ version: 'v3', chainName: 'invalidnetwork', identifier: '123', url: URL_BASE })

    expect(result).toBeUndefined()
    expect(mockLiquidityServicePost).not.toHaveBeenCalled()
  })

  it('returns undefined when the position is not found', async () => {
    mockLiquidityServicePost.mockResolvedValue({ position: undefined })

    const result = await getPosition({ version: 'v3', chainName: 'ethereum', identifier: '123', url: URL_BASE })

    expect(result).toBeUndefined()
  })
})
