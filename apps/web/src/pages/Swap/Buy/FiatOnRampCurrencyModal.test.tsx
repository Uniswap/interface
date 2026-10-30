import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { FiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/types'
import { BuyFormContext } from '~/pages/Swap/Buy/BuyFormContext'
import { FiatOnRampCurrencyModal } from '~/pages/Swap/Buy/FiatOnRampCurrencyModal'
import { mockBuyFormContext } from '~/pages/Swap/Buy/test/constants'
import { DAI_INFO, NATIVE_INFO, WETH_INFO } from '~/test-utils/constants'
import { fireEvent, render, screen } from '~/test-utils/render'

// jsdom has no layout, so the real virtualizer measures a zero-height viewport and renders no rows.
vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  UniversalList: (await import('@universe/mycelium/testing')).UniversalListTestDouble,
}))

// The data API names mainnet WETH "Wrapped Ethereum", so its row text contains the ETH row's name.
const WRAPPED_ETHEREUM_INFO = {
  ...WETH_INFO,
  currency: new Token(UniverseChainId.Mainnet, WETH_INFO.currency.wrapped.address, 18, 'WETH', 'Wrapped Ethereum'),
}

const ETH: FiatOnRampCurrency = { currencyInfo: NATIVE_INFO, meldCurrencyCode: 'ETH' }
const WETH: FiatOnRampCurrency = { currencyInfo: WRAPPED_ETHEREUM_INFO, meldCurrencyCode: 'WETH' }
const DAI: FiatOnRampCurrency = { currencyInfo: DAI_INFO, meldCurrencyCode: 'DAI' }

function renderModal({
  currencies = [ETH, WETH, DAI],
  unsupportedCurrencies = [],
}: {
  currencies?: FiatOnRampCurrency[]
  unsupportedCurrencies?: FiatOnRampCurrency[]
} = {}): { onSelectCurrency: ReturnType<typeof vi.fn>; onDismiss: ReturnType<typeof vi.fn> } {
  const onSelectCurrency = vi.fn()
  const onDismiss = vi.fn()
  render(
    <BuyFormContext.Provider value={mockBuyFormContext}>
      <FiatOnRampCurrencyModal
        isOpen
        onDismiss={onDismiss}
        onSelectCurrency={onSelectCurrency}
        currencies={currencies}
        unsupportedCurrencies={unsupportedCurrencies}
      />
    </BuyFormContext.Provider>,
  )
  return { onSelectCurrency, onDismiss }
}

describe('FiatOnRampCurrencyModal', () => {
  it('gives each supported row a test id keyed by its provider currency code', () => {
    renderModal()

    // Literals on purpose: deriving them from the prefix constant would let a broken key still pass.
    expect(screen.getByTestId('fiat-on-ramp-currency-row-supported-ETH')).toHaveTextContent('Ether')
    expect(screen.getByTestId('fiat-on-ramp-currency-row-supported-WETH')).toHaveTextContent('Wrapped Ethereum')
    expect(screen.getByTestId('fiat-on-ramp-currency-row-supported-DAI')).toHaveTextContent('DAI')
  })

  it('selects the native row, not the wrapped one whose name contains it', () => {
    const { onSelectCurrency, onDismiss } = renderModal()

    fireEvent.click(screen.getByTestId(`${TestID.FiatOnRampCurrencyRowPrefix}supported-ETH`))

    expect(onSelectCurrency).toHaveBeenCalledWith(ETH)
    expect(onSelectCurrency).not.toHaveBeenCalledWith(WETH)
    expect(onDismiss).toHaveBeenCalled()
  })

  it('keys unsupported rows by currency id, since they carry no provider code', () => {
    renderModal({
      currencies: [ETH],
      unsupportedCurrencies: [{ currencyInfo: DAI_INFO }],
    })

    expect(screen.getByTestId(`fiat-on-ramp-currency-row-unsupported-${DAI_INFO.currencyId}`)).toBeInTheDocument()
    expect(screen.queryByTestId('fiat-on-ramp-currency-row-supported-DAI')).not.toBeInTheDocument()
  })

  it('renders no row for a currency the data layer could not resolve', () => {
    renderModal({ currencies: [ETH, { currencyInfo: undefined, meldCurrencyCode: 'WETH' }] })

    expect(screen.getByTestId('fiat-on-ramp-currency-row-supported-ETH')).toBeInTheDocument()
    expect(screen.queryByTestId('fiat-on-ramp-currency-row-supported-WETH')).not.toBeInTheDocument()
  })
})
