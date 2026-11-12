import { renderHook } from '@testing-library/react'
import { ProtocolVersion as RestProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId } from '@universe/chains'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import type { PoolData } from '~/data/pools/poolData'
import { usePoolSpotPrice } from '~/pages/PoolDetails/components/ChartSection/usePoolSpotPrice'

const { mockUseLiquidityServiceGetPool } = vi.hoisted(() => ({
  mockUseLiquidityServiceGetPool: vi.fn(),
}))

vi.mock('~/features/Liquidity/hooks/useLiquidityServiceGetPool', () => ({
  useLiquidityServiceGetPool: mockUseLiquidityServiceGetPool,
}))

// Permission bits live in the low bits of a hook address: 0x08 is beforeSwapReturnsDelta, 0x80 is beforeSwap.
const CUSTOM_ACCOUNTING_HOOK = '0x0000000000000000000000000000000000000088'
const BEFORE_SWAP_ONLY_HOOK = '0x0000000000000000000000000000000000000080'
// sqrtPriceX96 at tick 0
const SQRT_PRICE_X96_TICK_0 = '79228162514264337593543950336'

const POOL_DATA = {
  idOrAddress: '0xbbb',
  token0: { chainId: UniverseChainId.Mainnet, address: '0x1111111111111111111111111111111111111111', decimals: 18 },
  token1: { chainId: UniverseChainId.Mainnet, address: '0x2222222222222222222222222222222222222222', decimals: 18 },
} as PoolData

function renderSpotPrice({
  version,
  liquidity,
  hookAddress,
}: {
  version: RestProtocolVersion
  liquidity?: string
  hookAddress?: string
}): number | undefined {
  mockUseLiquidityServiceGetPool.mockReturnValue({
    data: { pool: { currentTick: 0, sqrtPriceX96: SQRT_PRICE_X96_TICK_0, liquidity, hookAddress } },
  })
  const { result } = renderHook(() =>
    usePoolSpotPrice({
      poolData: POOL_DATA,
      isReversed: false,
      chainId: UniverseChainId.Mainnet,
      version,
      enabled: true,
    }),
  )
  return result.current
}

describe('usePoolSpotPrice', () => {
  it('skips the slot0 price for a custom-accounting v4 pool with no active liquidity', () => {
    expect(
      renderSpotPrice({ version: RestProtocolVersion.V4, liquidity: '0', hookAddress: CUSTOM_ACCOUNTING_HOOK }),
    ).toBe(undefined)
  })

  it.each([
    ['a hookless v4 pool with no active liquidity', RestProtocolVersion.V4, '0', undefined],
    ['a v4 pool with the zero-address hook and no active liquidity', RestProtocolVersion.V4, '0', ZERO_ADDRESS],
    [
      'a non-custom-accounting hooked v4 pool with no active liquidity',
      RestProtocolVersion.V4,
      '0',
      BEFORE_SWAP_ONLY_HOOK,
    ],
    ['a custom-accounting v4 pool with active liquidity', RestProtocolVersion.V4, '1000', CUSTOM_ACCOUNTING_HOOK],
    ['a v3 pool with no active liquidity', RestProtocolVersion.V3, '0', undefined],
    ['a v3 pool with a custom-accounting-shaped hook address', RestProtocolVersion.V3, '0', CUSTOM_ACCOUNTING_HOOK],
  ])('returns the slot0 price for %s', (_, version, liquidity, hookAddress) => {
    expect(renderSpotPrice({ version, liquidity, hookAddress })).toBe(1)
  })
})
