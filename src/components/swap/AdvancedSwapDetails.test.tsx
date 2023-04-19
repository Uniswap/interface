import { testAllowedSlippage, testTradeExactInput } from 'test-utils/constants'
import { fireEvent, render, screen } from 'test-utils/render'

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

  it('tooltips work as expected', async () => {
    render(<AdvancedSwapDetails trade={testTradeExactInput} allowedSlippage={testAllowedSlippage} />)
    fireEvent.mouseOver(screen.getByText('Price Impact'))
    expect(await screen.findByText(/The impact your trade has on the market price of this pool./i)).toBeVisible()
    fireEvent.mouseOver(screen.getByText('Expected Output'))
    expect(await screen.findByText(/The amount you expect to receive at the current market price./i)).toBeVisible()
    fireEvent.mouseOver(screen.getByText(/Minimum received/i))
    expect(await screen.findByText(/The minimum amount you are guaranteed to receive./i)).toBeVisible()
  })
})
