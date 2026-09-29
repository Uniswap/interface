import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { DAI, nativeOnChain, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { useUnwrapNativeCurrencyToggles } from '~/features/Liquidity/Create/hooks/useUnwrapNativeCurrencyToggles'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { fireEvent, render, screen } from '~/test-utils/render'
import { PositionField } from '~/types/position'

vi.mock('~/pages/CreatePosition/CreateLiquidityContextProvider', () => ({ useCreateLiquidityContext: vi.fn() }))

const mockedUseCreateLiquidityContext = vi.mocked(useCreateLiquidityContext)

const ETH = nativeOnChain(UniverseChainId.Mainnet)
const WETH = ETH.wrapped
const USDC = USDC_MAINNET

type CurrencyInputs = { tokenA: Maybe<Currency>; tokenB: Maybe<Currency> }
type CurrencyInputsUpdater = (prev: CurrencyInputs) => CurrencyInputs

function mockContext({
  protocolVersion,
  display,
  sdk,
  setCurrencyInputs = vi.fn(),
}: {
  protocolVersion: ProtocolVersion
  display: { TOKEN0: Currency; TOKEN1: Currency }
  sdk: { TOKEN0: Currency; TOKEN1: Currency }
  setCurrencyInputs?: ReturnType<typeof vi.fn>
}): void {
  mockedUseCreateLiquidityContext.mockReturnValue({
    protocolVersion,
    currencies: { display, sdk },
    setCurrencyInputs,
  } as unknown as ReturnType<typeof useCreateLiquidityContext>)
}

function Toggles(): JSX.Element {
  const toggles = useUnwrapNativeCurrencyToggles()
  return (
    <>
      <div data-testid="leg-0">{toggles[PositionField.TOKEN0]}</div>
      <div data-testid="leg-1">{toggles[PositionField.TOKEN1]}</div>
    </>
  )
}

describe('useUnwrapNativeCurrencyToggles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders an "Add as ETH" toggle only under the wrapped-native leg of a v3 pool, on while depositing ETH', () => {
    mockContext({
      protocolVersion: ProtocolVersion.V3,
      display: { TOKEN0: ETH, TOKEN1: USDC },
      sdk: { TOKEN0: WETH, TOKEN1: USDC },
    })
    render(<Toggles />)

    expect(screen.getByTestId('leg-0')).toHaveTextContent('Add as ETH')
    expect(screen.getByTestId('leg-1')).toBeEmptyDOMElement()
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('renders the toggle off while depositing the wrapped token, v2 included', () => {
    mockContext({
      protocolVersion: ProtocolVersion.V2,
      display: { TOKEN0: WETH, TOKEN1: USDC },
      sdk: { TOKEN0: WETH, TOKEN1: USDC },
    })
    render(<Toggles />)

    expect(screen.getByTestId('leg-0')).toHaveTextContent('Add as ETH')
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  // A v4 pool can hold native and wrapped native as two distinct currencies, so there is nothing to
  // toggle between: a WETH leg is WETH and an ETH leg is ETH.
  it('renders nothing for a v4 pool, native or wrapped', () => {
    mockContext({
      protocolVersion: ProtocolVersion.V4,
      display: { TOKEN0: ETH, TOKEN1: USDC },
      sdk: { TOKEN0: ETH, TOKEN1: USDC },
    })
    const { unmount } = render(<Toggles />)
    expect(screen.getByTestId('leg-0')).toBeEmptyDOMElement()
    expect(screen.getByTestId('leg-1')).toBeEmptyDOMElement()
    unmount()

    mockContext({
      protocolVersion: ProtocolVersion.V4,
      display: { TOKEN0: WETH, TOKEN1: USDC },
      sdk: { TOKEN0: WETH, TOKEN1: USDC },
    })
    render(<Toggles />)
    expect(screen.getByTestId('leg-0')).toBeEmptyDOMElement()
    expect(screen.getByTestId('leg-1')).toBeEmptyDOMElement()
  })

  it('renders nothing for a plain ERC-20 pair', () => {
    mockContext({
      protocolVersion: ProtocolVersion.V3,
      display: { TOKEN0: DAI, TOKEN1: USDC },
      sdk: { TOKEN0: DAI, TOKEN1: USDC },
    })
    render(<Toggles />)

    expect(screen.getByTestId('leg-0')).toBeEmptyDOMElement()
    expect(screen.getByTestId('leg-1')).toBeEmptyDOMElement()
  })

  it('turning the toggle off swaps only the input behind that leg to the wrapped token, whichever slot it sits in', () => {
    const setCurrencyInputs = vi.fn()
    mockContext({
      protocolVersion: ProtocolVersion.V3,
      display: { TOKEN0: ETH, TOKEN1: USDC },
      sdk: { TOKEN0: WETH, TOKEN1: USDC },
      setCurrencyInputs,
    })
    render(<Toggles />)

    fireEvent.click(screen.getByRole('switch'))

    expect(setCurrencyInputs).toHaveBeenCalledTimes(1)
    const update = setCurrencyInputs.mock.calls[0][0] as CurrencyInputsUpdater
    // The user's original selection order is preserved: the leg is swapped in place.
    expect(update({ tokenA: ETH, tokenB: USDC })).toEqual({ tokenA: WETH, tokenB: USDC })
    expect(update({ tokenA: USDC, tokenB: ETH })).toEqual({ tokenA: USDC, tokenB: WETH })
  })

  it('turning the toggle on swaps the wrapped input back to native', () => {
    const setCurrencyInputs = vi.fn()
    mockContext({
      protocolVersion: ProtocolVersion.V3,
      display: { TOKEN0: WETH, TOKEN1: USDC },
      sdk: { TOKEN0: WETH, TOKEN1: USDC },
      setCurrencyInputs,
    })
    render(<Toggles />)

    fireEvent.click(screen.getByRole('switch'))

    const update = setCurrencyInputs.mock.calls[0][0] as CurrencyInputsUpdater
    expect(update({ tokenA: WETH, tokenB: USDC })).toEqual({ tokenA: ETH, tokenB: USDC })
  })
})
