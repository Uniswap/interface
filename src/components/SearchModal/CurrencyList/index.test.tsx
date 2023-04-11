import { screen } from '@testing-library/react'
import { Currency, CurrencyAmount as mockCurrencyAmount, Token as mockToken } from '@uniswap/sdk-core'
import { DAI, USDC_MAINNET, WBTC } from 'constants/tokens'
import * as mockJSBI from 'jsbi'
import { render } from 'test-utils'

import CurrencyList from '.'

const noOp = function () {
  // do nothing
}

const mockCurrencyAmt = {
  [DAI.address]: mockCurrencyAmount.fromRawAmount(DAI, mockJSBI.default.BigInt(100)),
  [USDC_MAINNET.address]: mockCurrencyAmount.fromRawAmount(USDC_MAINNET, mockJSBI.default.BigInt(10)),
  [WBTC.address]: mockCurrencyAmount.fromRawAmount(WBTC, mockJSBI.default.BigInt(1)),
}

jest.mock(
  'components/Logo/CurrencyLogo',
  () =>
    ({ currency }: { currency: Currency }) =>
      `CurrencyLogo currency=${currency.symbol}`
)

jest.mock('@web3-react/core', () => {
  const web3React = jest.requireActual('@web3-react/core')
  return {
    ...web3React,
    useWeb3React: () => ({
      account: '123',
      isActive: true,
    }),
  }
})

jest.mock('../../../state/connection/hooks', () => {
  return {
    useCurrencyBalance: (currency: Currency) => {
      return mockCurrencyAmt[(currency as mockToken)?.address]
    },
  }
})

it('renders loading rows when isLoading is true', () => {
  const component = render(
    <CurrencyList
      height={10}
      currencies={[]}
      otherListTokens={[]}
      selectedCurrency={null}
      onCurrencySelect={noOp}
      isLoading={true}
      searchQuery=""
      isAddressSearch=""
    />
  )
  expect(component.findByTestId('loading-rows')).toBeTruthy()
  expect(screen.queryByText('Wrapped BTC')).not.toBeInTheDocument()
  expect(screen.queryByText('DAI')).not.toBeInTheDocument()
  expect(screen.queryByText('USDC')).not.toBeInTheDocument()
})

it('renders currency rows correctly when currencies list is non-empty', () => {
  render(
    <CurrencyList
      height={10}
      currencies={[DAI, USDC_MAINNET, WBTC]}
      otherListTokens={[]}
      selectedCurrency={null}
      onCurrencySelect={noOp}
      isLoading={false}
      searchQuery=""
      isAddressSearch=""
    />
  )
  expect(screen.getByText('Wrapped BTC')).toBeInTheDocument()
  expect(screen.getByText('DAI')).toBeInTheDocument()
  expect(screen.getByText('USDC')).toBeInTheDocument()
})
