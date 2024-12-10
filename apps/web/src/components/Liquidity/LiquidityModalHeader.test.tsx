import { LiquidityModalHeader } from 'components/Liquidity/LiquidityModalHeader'
import { WebUniswapProvider } from 'components/Web3Provider/WebUniswapContext'
import { act, fireEvent, render } from 'test-utils/render'
import { SwapSettingsContextProvider } from 'uniswap/src/features/transactions/swap/settings/contexts/SwapSettingsContext'

describe('LiquidityModalHeader', () => {
  it('should render with given title and call close callback', () => {
    const onClose = jest.fn()
    const { getByText, getByTestId } = render(
      <WebUniswapProvider>
        <SwapSettingsContextProvider>
          <LiquidityModalHeader title="Test Title" closeModal={onClose} />
        </SwapSettingsContextProvider>
        ,
      </WebUniswapProvider>,
    )
    expect(getByText('Test Title')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    act(() => {
      fireEvent(getByTestId('LiquidityModalHeader-close'), new MouseEvent('click', { bubbles: true }))
    })
    expect(onClose).toHaveBeenCalled()
  })
})
