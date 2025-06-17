import { ConfirmModalState } from 'components/ConfirmSwapModal'
import { SwapHead } from 'components/ConfirmSwapModal/Head'
import { fireEvent, render, screen } from 'test-utils/render'

describe('ConfirmSwapModal/Head', () => {
  it('should render correctly for a classic swap', () => {
    const { asFragment } = render(
      <SwapHead onDismiss={vi.fn()} isLimitTrade={false} confirmModalState={ConfirmModalState.REVIEWING} />,
    )
    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByText('Review swap')).toBeInTheDocument()
  })

  it('should render correctly for a Limit order', () => {
    const { asFragment } = render(
      <SwapHead onDismiss={vi.fn()} isLimitTrade={true} confirmModalState={ConfirmModalState.REVIEWING} />,
    )
    expect(asFragment()).toMatchSnapshot()
    expect(screen.getByText('Review limit')).toBeInTheDocument()
  })

  it('should call the close callback', () => {
    const callback = vi.fn()
    const component = render(
      <SwapHead onDismiss={callback} isLimitTrade={false} confirmModalState={ConfirmModalState.REVIEWING} />,
    )

    const button = component.getByTestId('confirmation-close-icon')

    fireEvent.click(button)

    expect(callback).toHaveBeenCalled()
  })
})
