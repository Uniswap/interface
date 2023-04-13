import { CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Route as V3Route } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { InterfaceTrade } from 'state/routing/types'
import { render } from 'test-utils'

import { AdvancedSwapDetails } from './AdvancedSwapDetails'

const token1 = new Token(1, '0x0000000000000000000000000000000000000001', 18)
const token2 = new Token(1, '0x0000000000000000000000000000000000000002', 18)

const pool12 = new Pool(token1, token2, FeeAmount.HIGH, '2437312313659959819381354528', '10272714736694327408', -69633)

const currencyAmount = (token: Token, amount: number) => CurrencyAmount.fromRawAmount(token, JSBI.BigInt(amount))

const trade = new InterfaceTrade({
  v3Routes: [
    {
      routev3: new V3Route([pool12], token1, token2),
      inputAmount: currencyAmount(token1, 1000),
      outputAmount: currencyAmount(token2, 1000),
    },
  ],
  v2Routes: [],
  tradeType: TradeType.EXACT_INPUT,
})
const allowedSlippage = new Percent(2, 100)

jest.mock('@web3-react/core', () => {
  const web3React = jest.requireActual('@web3-react/core')
  return {
    ...web3React,
    useWeb3React: () => ({
      chainId: 1,
    }),
  }
})
// jest.mock('../../state/application/hooks')
// const mockUseFiatOnrampAvailability = useFiatOnrampAvailability as jest.MockedFunction<typeof useFiatOnrampAvailability>

describe('AdvancedSwapDetails.tsx', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(<AdvancedSwapDetails trade={trade} allowedSlippage={allowedSlippage} />)
    expect(asFragment()).toMatchSnapshot()
  })
})
