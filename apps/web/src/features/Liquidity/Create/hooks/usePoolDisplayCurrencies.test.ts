import { renderHook } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { nativeOnChain, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { usePoolDisplayCurrencies } from '~/features/Liquidity/Create/hooks/usePoolDisplayCurrencies'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'

vi.mock('~/pages/CreatePosition/CreateLiquidityContextProvider', () => ({ useCreateLiquidityContext: vi.fn() }))

const mockedUseCreateLiquidityContext = vi.mocked(useCreateLiquidityContext)

const ETH = nativeOnChain(UniverseChainId.Mainnet)
const WETH = ETH.wrapped
const USDC = USDC_MAINNET

function mockContext({
  protocolVersion,
  display,
  sdk,
}: {
  protocolVersion: ProtocolVersion
  display: { TOKEN0: Currency; TOKEN1: Currency }
  sdk: { TOKEN0: Currency; TOKEN1: Currency }
}): void {
  mockedUseCreateLiquidityContext.mockReturnValue({
    protocolVersion,
    currencies: { display, sdk },
  } as unknown as ReturnType<typeof useCreateLiquidityContext>)
}

describe('usePoolDisplayCurrencies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads a v3 wrapped-native leg as native whichever form is being deposited', () => {
    const sdk = { TOKEN0: WETH, TOKEN1: USDC }
    mockContext({ protocolVersion: ProtocolVersion.V3, display: { TOKEN0: WETH, TOKEN1: USDC }, sdk })
    const { result, rerender } = renderHook(() => usePoolDisplayCurrencies())

    expect(result.current.TOKEN0).toBe(ETH)
    expect(result.current.TOKEN1).toBe(USDC)
    const whileDepositingWeth = result.current

    // The deposit toggle only changes `display`; the pool's presentation, and its identity, hold still.
    mockContext({ protocolVersion: ProtocolVersion.V3, display: { TOKEN0: ETH, TOKEN1: USDC }, sdk })
    rerender()

    expect(result.current).toBe(whileDepositingWeth)
  })

  it('keeps a v4 wrapped leg as served, since v4 can hold native and wrapped as distinct legs', () => {
    mockContext({
      protocolVersion: ProtocolVersion.V4,
      display: { TOKEN0: WETH, TOKEN1: USDC },
      sdk: { TOKEN0: WETH, TOKEN1: USDC },
    })
    const { result } = renderHook(() => usePoolDisplayCurrencies())

    expect(result.current.TOKEN0).toBe(WETH)
    expect(result.current.TOKEN1).toBe(USDC)
  })
})
