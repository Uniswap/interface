import { testAllowedSlippage, testTradeExactInput } from 'test-utils/constants'
import { render } from 'test-utils/render'

import { AdvancedSwapDetails } from './AdvancedSwapDetails'

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
    const { asFragment } = render(
      <AdvancedSwapDetails trade={testTradeExactInput} allowedSlippage={testAllowedSlippage} />
    )
    expect(asFragment()).toMatchSnapshot()
  })
})
