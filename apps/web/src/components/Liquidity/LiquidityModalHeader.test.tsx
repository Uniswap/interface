import { LiquidityModalHeader } from 'components/Liquidity/LiquidityModalHeader'
import { WebUniswapProvider } from 'components/Web3Provider/WebUniswapContext'
import { ExternalWalletProvider } from 'features/wallet/providers/ExternalWalletProvider'
import { act, fireEvent, render } from 'test-utils/render'
import { LPTransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/LPTransactionSettingsStoreContextProvider'

describe('LiquidityModalHeader', () => {
  it('should render with given title and call close callback', () => {
    const onClose = vi.fn()
    const { getByText, getByTestId } = render(
      <ExternalWalletProvider>
        <WebUniswapProvider>
          <LPTransactionSettingsStoreContextProvider>
            <LiquidityModalHeader title="Test Title" closeModal={onClose} />
          </LPTransactionSettingsStoreContextProvider>
        </WebUniswapProvider>
      </ExternalWalletProvider>,
    )
    expect(getByText('Test Title')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    act(() => {
      fireEvent(getByTestId('LiquidityModalHeader-close'), new MouseEvent('click', { bubbles: true }))
    })
    expect(onClose).toHaveBeenCalled()
  })
})
