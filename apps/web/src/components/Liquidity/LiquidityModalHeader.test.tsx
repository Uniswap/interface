import { LiquidityModalHeader } from 'components/Liquidity/LiquidityModalHeader'
import { WebUniswapProvider } from 'components/Web3Provider/WebUniswapContext'
import { act, fireEvent, render } from 'test-utils/render'
import { TransactionSettingsContextProvider } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { TransactionSettingKey } from 'uniswap/src/features/transactions/settings/slice'

describe('LiquidityModalHeader', () => {
  it('should render with given title and call close callback', () => {
    const onClose = jest.fn()
    const { getByText, getByTestId } = render(
      <WebUniswapProvider>
        <TransactionSettingsContextProvider settingKey={TransactionSettingKey.Swap}>
          <LiquidityModalHeader title="Test Title" closeModal={onClose} />
        </TransactionSettingsContextProvider>
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
