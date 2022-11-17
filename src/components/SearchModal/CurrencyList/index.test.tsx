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
    useWeb3React: () => ({
      account: '123',
      isActive: true,
    }),
    ...web3React,
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
  const { asFragment } = render(
    <CurrencyList
      height={10}
      currencies={[]}
      otherListTokens={[]}
      selectedCurrency={null}
      onCurrencySelect={noOp}
      showImportView={noOp}
      setImportToken={noOp}
      isLoading={true}
      searchQuery=""
      isAddressSearch=""
    />
  )
  expect(asFragment()).toMatchSnapshot()
})

it('renders currency rows correctly when currencies list is non-empty', () => {
  const { asFragment } = render(
    <CurrencyList
      height={10}
      currencies={[DAI, USDC_MAINNET, WBTC]}
      otherListTokens={[]}
      selectedCurrency={null}
      onCurrencySelect={noOp}
      showImportView={noOp}
      setImportToken={noOp}
      isLoading={false}
      searchQuery=""
      isAddressSearch=""
    />
  )
  expect(asFragment()).toMatchSnapshot()
})
