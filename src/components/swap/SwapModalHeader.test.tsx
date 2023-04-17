import { noop, testAllowedSlippage, testRecipientAddress, testTrade } from 'test-utils/constants'
import { render } from 'test-utils/render'

import SwapModalHeader from './SwapModalHeader'

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

describe('SwapModalHeader.tsx', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(
      <SwapModalHeader
        trade={testTrade}
        allowedSlippage={testAllowedSlippage}
        shouldLogModalCloseEvent={false}
        showAcceptChanges={false}
        setShouldLogModalCloseEvent={noop}
        onAcceptChanges={noop}
        recipient={testRecipientAddress}
      />
    )
    expect(asFragment()).toMatchSnapshot()
  })
})
