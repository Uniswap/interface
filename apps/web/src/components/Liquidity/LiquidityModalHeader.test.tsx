import { LiquidityModalHeader } from 'components/Liquidity/LiquidityModalHeader'
import { act, fireEvent, render } from 'test-utils/render'

describe('LiquidityModalHeader', () => {
  it('should render with given title and call close callback', () => {
    const onClose = jest.fn()
    const { getByText, getByTestId } = render(<LiquidityModalHeader title="Test Title" closeModal={onClose} />)
    expect(getByText('Test Title')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    act(() => {
      fireEvent(getByTestId('LiquidityModalHeader-close'), new MouseEvent('click', { bubbles: true }))
    })
    expect(onClose).toHaveBeenCalled()
  })
})
