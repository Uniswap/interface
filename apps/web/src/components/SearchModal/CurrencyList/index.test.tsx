import { screen } from '@testing-library/react'
import { Currency, CurrencyAmount as mockCurrencyAmount, Token as mockToken } from '@uniswap/sdk-core'
import CurrencyList, { CurrencyListRow } from 'components/SearchModal/CurrencyList'
import { DAI, USDC_MAINNET, WBTC } from 'constants/tokens'
import { useAccount } from 'hooks/useAccount'
import * as mockJSBI from 'jsbi'
import { USE_DISCONNECTED_ACCOUNT } from 'test-utils/constants'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'

const noOp = function () {
  // do nothing
}

const mockCurrencyAmt = {
  [DAI.address]: mockCurrencyAmount.fromRawAmount(DAI, mockJSBI.default.BigInt(100)),
  [USDC_MAINNET.address]: mockCurrencyAmount.fromRawAmount(USDC_MAINNET, mockJSBI.default.BigInt(10)),
  [WBTC.address]: mockCurrencyAmount.fromRawAmount(WBTC, mockJSBI.default.BigInt(1)),
}

jest.mock('hooks/useAccount', () => ({
  useAccount: jest.fn(),
}))

jest.mock(
  'components/Logo/CurrencyLogo',
  () =>
    ({ currency }: { currency: Currency }) =>
      `CurrencyLogo currency=${currency.symbol}`,
)

jest.mock('../../../state/connection/hooks', () => {
  return {
    useCurrencyBalance: (currency: Currency) => {
      return mockCurrencyAmt[(currency as mockToken)?.address]
    },
  }
})

it('renders loading rows when isLoading is true', () => {
  mocked(useAccount).mockReturnValue(USE_DISCONNECTED_ACCOUNT)

  const component = render(
    <CurrencyList
      height={10}
      currencies={[]}
      onCurrencySelect={noOp}
      isLoading={true}
      searchQuery=""
      isAddressSearch=""
      balances={{}}
    />,
  )
  expect(component.findByTestId('loading-rows')).toBeTruthy()
  expect(screen.queryByText('Wrapped BTC')).not.toBeInTheDocument()
  expect(screen.queryByText('DAI')).not.toBeInTheDocument()
  expect(screen.queryByText('USDC')).not.toBeInTheDocument()
})

it('renders currency rows correctly when currencies list is non-empty', () => {
  mocked(useAccount).mockReturnValue(USE_DISCONNECTED_ACCOUNT)

  render(
    <CurrencyList
      height={10}
      currencies={[DAI, USDC_MAINNET, WBTC].map((token) => new CurrencyListRow(token))}
      onCurrencySelect={noOp}
      isLoading={false}
      searchQuery=""
      isAddressSearch=""
      balances={{}}
    />,
  )
  expect(screen.getByText('Wrapped BTC')).toBeInTheDocument()
  expect(screen.getByText('DAI')).toBeInTheDocument()
  expect(screen.getByText('USDC')).toBeInTheDocument()
})

it('renders currency rows correctly with balances', () => {
  mocked(useAccount).mockReturnValue({
    ...USE_DISCONNECTED_ACCOUNT,
    isConnected: true,
  } as unknown as ReturnType<typeof useAccount>)
  render(
    <CurrencyList
      height={10}
      currencies={[DAI, USDC_MAINNET, WBTC].map((token) => new CurrencyListRow(token))}
      onCurrencySelect={noOp}
      isLoading={false}
      searchQuery=""
      isAddressSearch=""
      showCurrencyAmount
      balances={{
        [`1-${DAI.address.toLowerCase()}`]: { usdValue: 2, balance: 2 },
      }}
    />,
  )
  expect(screen.getByText('Wrapped BTC')).toBeInTheDocument()
  expect(screen.getByText('DAI')).toBeInTheDocument()
  expect(screen.getByText('USDC')).toBeInTheDocument()
  expect(screen.getByText('2.00')).toBeInTheDocument()
})
