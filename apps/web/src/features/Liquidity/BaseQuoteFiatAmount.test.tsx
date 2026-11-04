import { type Currency, CurrencyAmount, Price, Token } from '@uniswap/sdk-core'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { BaseQuoteFiatAmount } from '~/features/Liquidity/BaseQuoteFiatAmount'
import { render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({ useUSDCValue: vi.fn() }))

const mockedUseUSDCValue = vi.mocked(useUSDCValue)

const CASHCAT = new Token(1, '0x0000000000000000000000000000000000000001', 18, 'CASHCAT')
const WETH = new Token(1, '0x0000000000000000000000000000000000000002', 18, 'WETH')
const USDC = new Token(1, '0x0000000000000000000000000000000000000003', 6, 'USDC')

// 1 WETH = 2900 USDC
const WETH_USDC_PRICE: Price<Currency, Currency> = new Price(WETH, USDC, '1000000000000000000', '2900000000')

function fakeUsdValue(amount: Maybe<CurrencyAmount<Currency>>): CurrencyAmount<Currency> | null {
  return amount ? WETH_USDC_PRICE.quote(amount) : null
}

describe('BaseQuoteFiatAmount', () => {
  beforeEach(() => {
    mockedUseUSDCValue.mockImplementation(fakeUsdValue)
  })

  it('prices the fiat value from the exact ratio, not the 4-decimal toFixed() rounding', () => {
    // 6.15e-5 WETH per CASHCAT; toFixed() would round this to 0.0001 WETH ($0.29)
    const price = new Price(CASHCAT, WETH, 10_000_000, 615)
    render(<BaseQuoteFiatAmount price={price} base={CASHCAT} quote={WETH} />)

    const quoteAmount = mockedUseUSDCValue.mock.calls.at(-1)?.[0]
    expect(quoteAmount?.currency).toBe(WETH)
    expect(quoteAmount?.toExact()).toBe('0.0000615')
    expect(screen.getByText('($0.178)')).toBeInTheDocument()
  })

  it('still produces a fiat value for ratios below 5e-5', () => {
    // 1.23e-8 WETH per CASHCAT; toFixed() returns "0.0000", which used to yield no fiat value
    const price = new Price(CASHCAT, WETH, 10_000_000_000, 123)
    render(<BaseQuoteFiatAmount price={price} base={CASHCAT} quote={WETH} />)

    expect(mockedUseUSDCValue.mock.calls.at(-1)?.[0]?.toExact()).toBe('0.0000000123')
  })

  it('renders a fiat value below $0.000001 instead of flooring it to $0', () => {
    // 2e-10 WETH per CASHCAT = $0.00000058, below USDC's 6-decimal resolution
    const price = new Price(CASHCAT, WETH, 10_000_000_000, 2)
    render(<BaseQuoteFiatAmount price={price} base={CASHCAT} quote={WETH} />)

    expect(screen.getByText('($0.000000580)')).toBeInTheDocument()
  })

  it('renders nothing and requests no fiat value when there is no price', () => {
    const { container } = render(<BaseQuoteFiatAmount price={undefined} base={CASHCAT} quote={WETH} />)

    expect(mockedUseUSDCValue).toHaveBeenLastCalledWith(undefined)
    expect(container).toBeEmptyDOMElement()
  })
})
