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
  'components/CurrencyLogo',
  () =>
    ({ currency }: { currency: Currency }) =>
      `CurrencyLogo currency=${currency.symbol}`
)

jest.mock('hooks/useActiveWeb3React', () => {
  return {
    __esModule: true,
    default: () => ({
      account: '123',
      active: true,
    }),
  }
})

jest.mock('../../../state/wallet/hooks', () => {
  return {
    useCurrencyBalance: (currency: Currency) => {
      return mockCurrencyAmt[(currency as mockToken).address]
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
    />
  )
  expect(asFragment()).toMatchSnapshot()
})
