import { fireEvent, screen, within } from '@testing-library/react-native'
import { SharedEventName } from '@uniswap/analytics-events'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { CurrencyInputPanel } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import type { CurrencyInputPanelProps } from 'uniswap/src/components/CurrencyInputPanel/types'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { ETH_CURRENCY_INFO } from 'uniswap/src/test/fixtures'
import { renderWithProviders } from 'uniswap/src/test/render'
import { CurrencyField } from 'uniswap/src/types/currency'
import { TraceContext } from 'utilities/src/telemetry/trace/TraceContext'

const mocks = vi.hoisted(() => ({
  isWebPlatform: false,
  sendAnalyticsEvent: vi.fn(),
  usdPrice: undefined as unknown,
}))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isWebPlatform(): boolean {
      return mocks.isWebPlatform
    },
  }
})

vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: mocks.sendAnalyticsEvent }))

// The max spendable is the whole balance here, so the presets and the balance press fill it as is.
vi.mock('uniswap/src/features/gas/hooks/useMaxAmountSpend', () => ({
  useMaxAmountSpend: ({ currencyAmount }: { currencyAmount: unknown }): unknown => currencyAmount,
}))

vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({
  useUSDCPrice: (): { price: unknown } => ({ price: mocks.usdPrice }),
}))

vi.mock('uniswap/src/features/accounts/store/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/features/accounts/store/hooks')>()
  return { ...actual, useConnectionStatus: (): { isDisconnected: boolean } => ({ isDisconnected: false }) }
})

vi.mock('uniswap/src/features/transactions/hooks/useTokenAndFiatDisplayAmounts', () => ({
  useTokenAndFiatDisplayAmounts: (): string => '$2,500.00',
}))

const balance = CurrencyAmount.fromRawAmount(ETH_CURRENCY_INFO.currency, '2000000000000000000')
const oneEth = CurrencyAmount.fromRawAmount(ETH_CURRENCY_INFO.currency, '1000000000000000000')
// The formatted balance, then the symbol.
const BALANCE_TEXT = /^\S+ ETH$/

function renderPanel(props: Partial<CurrencyInputPanelProps> = {}): {
  onSetExactAmount: ReturnType<typeof vi.fn>
  onSetPresetValue: ReturnType<typeof vi.fn>
  onToggleIsFiatMode: ReturnType<typeof vi.fn>
} {
  const onSetExactAmount = vi.fn()
  const onSetPresetValue = vi.fn()
  const onToggleIsFiatMode = vi.fn()
  renderWithProviders(
    <TraceContext.Provider value={{ section: SectionName.CurrencyInputPanel }}>
      <CurrencyInputPanel
        currencyAmount={oneEth}
        currencyBalance={balance}
        currencyField={CurrencyField.INPUT}
        currencyInfo={ETH_CURRENCY_INFO}
        usdValue={undefined}
        value="1"
        onSetExactAmount={onSetExactAmount}
        onSetPresetValue={onSetPresetValue}
        onToggleIsFiatMode={onToggleIsFiatMode}
        {...props}
      />
    </TraceContext.Provider>,
  )
  return { onSetExactAmount, onSetPresetValue, onToggleIsFiatMode }
}

describe('CurrencyInputPanel', () => {
  beforeEach(() => {
    mocks.isWebPlatform = false
    mocks.usdPrice = undefined
    mocks.sendAnalyticsEvent.mockClear()
  })

  it('renders the token, the balance and the fiat line, and parses typed text', () => {
    const { onSetExactAmount } = renderPanel()

    expect(within(screen.getByTestId(`${TestID.ChooseInputToken}-label`)).getByText('ETH')).toBeTruthy()
    expect(screen.getByText(BALANCE_TEXT)).toBeTruthy()
    expect(screen.getByText('$2,500.00')).toBeTruthy()

    fireEvent.changeText(screen.getByTestId(TestID.AmountInputIn), '1,5.')
    expect(onSetExactAmount).toHaveBeenLastCalledWith('15.')
  })

  it('fills the max from the balance', () => {
    const { onSetPresetValue } = renderPanel()

    fireEvent.press(screen.getByText(BALANCE_TEXT))

    expect(onSetPresetValue).toHaveBeenCalledWith('2', 'max')
  })

  it('fills from the lone Max and logs the old Trace press event on native', () => {
    const { onSetPresetValue } = renderPanel({ showMaxButtonOnly: true })

    fireEvent.press(screen.getByTestId(TestID.SetMaxInput))

    expect(onSetPresetValue).toHaveBeenCalledWith('2', 'max')
    expect(mocks.sendAnalyticsEvent).toHaveBeenCalledWith(SharedEventName.ELEMENT_CLICKED, {
      section: SectionName.CurrencyInputPanel,
      element: ElementName.SetPercentageInput,
      percentage: 'max',
    })
  })

  it('logs nothing for the lone Max on web, where the old button never logged', () => {
    mocks.isWebPlatform = true
    const { onSetPresetValue } = renderPanel({ showMaxButtonOnly: true })

    fireEvent.press(screen.getByTestId(TestID.SetMaxInput))

    expect(onSetPresetValue).toHaveBeenCalledWith('2', 'max')
    expect(mocks.sendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('toggles fiat mode from the fiat line when there is a price', () => {
    mocks.usdPrice = {}
    const { onToggleIsFiatMode } = renderPanel()

    fireEvent.press(screen.getByText('$2,500.00'))

    expect(onToggleIsFiatMode).toHaveBeenCalledWith(CurrencyField.INPUT)
  })

  it('keeps token mode without a price', () => {
    const { onToggleIsFiatMode } = renderPanel()

    fireEvent.press(screen.getByText('$2,500.00'))

    expect(onToggleIsFiatMode).not.toHaveBeenCalled()
  })

  it('routes presses to onPressDisabled while disabled', () => {
    const onPressDisabled = vi.fn()
    const { onToggleIsFiatMode } = renderPanel({ disabled: true, onPressDisabled })

    fireEvent.press(screen.getByText('$2,500.00'))

    expect(onPressDisabled).toHaveBeenCalled()
    expect(onToggleIsFiatMode).not.toHaveBeenCalled()
  })

  it('hides the token button and the balance with hidePresets', () => {
    renderPanel({ hidePresets: true })

    expect(screen.queryByTestId(TestID.ChooseInputToken)).toBeNull()
    expect(screen.queryByText(BALANCE_TEXT)).toBeNull()
  })

  it('hides only the balance with hideBalance', () => {
    renderPanel({ hideBalance: true })

    expect(screen.getByTestId(`${TestID.ChooseInputToken}-label`)).toBeTruthy()
    expect(screen.queryByText(BALANCE_TEXT)).toBeNull()
  })

  it('renders the header accessory', () => {
    renderPanel({ headerLabel: 'Pay', headerAccessory: <Text>$100</Text> })

    expect(screen.getByText('$100')).toBeTruthy()
  })
})
