import { fireEvent, render } from '@testing-library/react'
import { SharedEventName } from '@uniswap/analytics-events'
import { UniverseChainId } from '@universe/chains'
import { SwapFormButtonTrace } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/SwapFormButtonTrace'
import { SwapFormButtonAction } from 'uniswap/src/features/transactions/swap/types/swapFormButtonAction'

const { mockSendEvent } = vi.hoisted(() => ({ mockSendEvent: vi.fn() }))

vi.mock('utilities/src/telemetry/analytics/analytics', () => ({
  analytics: { sendEvent: mockSendEvent },
}))

vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore', () => ({
  useSwapFormStore: (selector: (s: unknown) => unknown): unknown =>
    selector({ exactAmountToken: '1.5', exactAmountFiat: undefined }),
  useSwapFormStoreDerivedSwapInfo: (selector: (s: unknown) => unknown): unknown =>
    selector({ chainId: UniverseChainId.Mainnet }),
}))

function PressTarget({ onClick, onPress }: { onClick?: () => void; onPress?: () => void }): JSX.Element {
  return (
    <button type="button" onClick={onClick ?? onPress}>
      swap
    </button>
  )
}

describe(SwapFormButtonTrace, () => {
  beforeEach(() => {
    mockSendEvent.mockClear()
  })

  it.each([SwapFormButtonAction.AddFunds, SwapFormButtonAction.ConnectWallet, SwapFormButtonAction.Review])(
    'logs element swap-review with action %s on press',
    (action) => {
      const { getByRole } = render(
        <SwapFormButtonTrace action={action}>
          <PressTarget />
        </SwapFormButtonTrace>,
      )

      fireEvent.click(getByRole('button'))

      expect(mockSendEvent).toHaveBeenCalledTimes(1)
      expect(mockSendEvent).toHaveBeenCalledWith(
        SharedEventName.ELEMENT_CLICKED,
        expect.objectContaining({
          element: 'swap-review',
          action,
          chainId: UniverseChainId.Mainnet,
          tokenAmount: '1.5',
        }),
      )
    },
  )

  it('logs the action of the latest render, not the first', () => {
    const { getByRole, rerender } = render(
      <SwapFormButtonTrace action={SwapFormButtonAction.ConnectWallet}>
        <PressTarget />
      </SwapFormButtonTrace>,
    )
    rerender(
      <SwapFormButtonTrace action={SwapFormButtonAction.AddFunds}>
        <PressTarget />
      </SwapFormButtonTrace>,
    )

    fireEvent.click(getByRole('button'))

    expect(mockSendEvent).toHaveBeenCalledWith(
      SharedEventName.ELEMENT_CLICKED,
      expect.objectContaining({ element: 'swap-review', action: 'add_funds' }),
    )
  })
})
