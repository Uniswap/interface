import { TEST_ALLOWED_SLIPPAGE, TEST_TRADE_EXACT_INPUT } from 'test-utils/constants'
import { render, screen } from 'test-utils/render'

import SwapModalFooter from './SwapModalFooter'

const swapErrorMessage = 'swap error'
const fiatValue = { data: 123, isLoading: false }

describe('SwapModalFooter.tsx', () => {
  it('matches base snapshot', () => {
    const { asFragment } = render(
      <SwapModalFooter
        trade={TEST_TRADE_EXACT_INPUT}
        allowedSlippage={TEST_ALLOWED_SLIPPAGE}
        hash={undefined}
        onConfirm={() => null}
        disabledConfirm
        swapErrorMessage={swapErrorMessage}
        swapQuoteReceivedDate={undefined}
        fiatValueInput={fiatValue}
        fiatValueOutput={fiatValue}
      />
    )
    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByTestId('confirm-swap-button')).toBeDisabled()
  })
})
