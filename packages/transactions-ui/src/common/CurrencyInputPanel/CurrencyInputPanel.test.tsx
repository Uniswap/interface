// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import type { CurrencyInputPanelProps } from '@universe/transactions-ui/src/common/CurrencyInputPanel/CurrencyInputPanel'
import { CurrencyInputPanel } from '@universe/transactions-ui/src/common/CurrencyInputPanel/CurrencyInputPanel'
import type { TokenSelectButtonToken } from '@universe/transactions-ui/src/common/TokenSelectButton/TokenSelectButton'
import { beforeAll, describe, expect, it, vi } from 'vitest'

const eth: TokenSelectButtonToken = { symbol: 'ETH', logo: { symbol: 'ETH' } }

beforeAll(() => {
  // useMedia and the short-device check read matchMedia, which jsdom lacks.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    })),
  })
})

function renderPanel(props: Partial<CurrencyInputPanelProps> = {}): ReturnType<typeof render> {
  return render(
    <CurrencyInputPanel
      amount={{ value: '1.5', onChangeValue: vi.fn(), testID: 'amount-input' }}
      balance={{ amount: '3.2', symbol: 'ETH' }}
      fiatValue="$4,861.80"
      label="Sell"
      token={eth}
      tokenButton={{ testID: 'choose-token' }}
      onPressSelectToken={vi.fn()}
      {...props}
    />,
  )
}

describe('CurrencyInputPanel', () => {
  it('renders the label, amount, fiat line, balance and token', () => {
    renderPanel()
    expect(screen.getByText('Sell')).toBeTruthy()
    expect((screen.getByTestId('amount-input') as HTMLInputElement).value).toBe('1.5')
    expect(screen.getByText('$4,861.80')).toBeTruthy()
    expect(screen.getByText('3.2 ETH')).toBeTruthy()
    expect(screen.getByTestId('choose-token-label').textContent).toBe('ETH')
  })

  it('renders the empty state and routes presses to the token selector', () => {
    const onPressSelectToken = vi.fn()
    renderPanel({ token: undefined, amount: { value: '', onChangeValue: vi.fn() }, onPressSelectToken })
    expect(screen.getByText('tokens.selector.button.choose')).toBeTruthy()
    fireEvent.click(screen.getByText('0'))
    expect(onPressSelectToken).toHaveBeenCalled()
  })

  it('replaces the empty 0 with the token options slot', () => {
    renderPanel({ token: undefined, amount: { value: '', onChangeValue: vi.fn() }, tokenOptions: <span>chips</span> })
    expect(screen.getByText('chips')).toBeTruthy()
    expect(screen.queryByText('0')).toBeNull()
  })

  it('fills from the balance without pressing the panel', () => {
    const onPressBalance = vi.fn()
    const onPressIn = vi.fn()
    renderPanel({ balance: { amount: '3.2', symbol: 'ETH', onPress: onPressBalance }, onPressIn })
    fireEvent.click(screen.getByText('3.2 ETH'))
    expect(onPressBalance).toHaveBeenCalledTimes(1)
    expect(onPressIn).not.toHaveBeenCalled()
  })

  it('shows footer presets only while the amount is empty', () => {
    const presets: CurrencyInputPanelProps['presets'] = {
      placement: 'footer',
      presets: [{ percentage: 50 }],
      onSelectPreset: vi.fn(),
    }
    const { rerender } = renderPanel({ presets, amount: { value: '', onChangeValue: vi.fn() } })
    expect(screen.getByText('50%')).toBeTruthy()
    expect(screen.queryByText('$4,861.80')).toBeNull()
    rerender(
      <CurrencyInputPanel
        amount={{ value: '1', onChangeValue: vi.fn() }}
        balance={{ amount: '3.2', symbol: 'ETH' }}
        fiatValue="$4,861.80"
        presets={presets}
        token={eth}
      />,
    )
    expect(screen.queryByText('50%')).toBeNull()
    expect(screen.getByText('$4,861.80')).toBeTruthy()
  })

  it('keys the footer presets on the host amount when given', () => {
    const presets: CurrencyInputPanelProps['presets'] = {
      placement: 'footer',
      presets: [{ percentage: 50 }],
      onSelectPreset: vi.fn(),
    }
    const { rerender } = renderPanel({ presets, amount: { value: '0', onChangeValue: vi.fn() }, hasAmount: false })
    expect(screen.getByText('50%')).toBeTruthy()
    rerender(
      <CurrencyInputPanel
        hasAmount
        amount={{ value: '', onChangeValue: vi.fn() }}
        balance={{ amount: '3.2', symbol: 'ETH' }}
        fiatValue="$4,861.80"
        presets={presets}
        token={eth}
      />,
    )
    expect(screen.queryByText('50%')).toBeNull()
    expect(screen.getByText('$4,861.80')).toBeTruthy()
  })

  it('renders a lone Max after the balance', () => {
    const onSelectPreset = vi.fn()
    renderPanel({ presets: { placement: 'balance', presets: [{ percentage: 'max' }], onSelectPreset } })
    fireEvent.click(screen.getByText('swap.button.max'))
    expect(onSelectPreset).toHaveBeenCalledWith('max')
  })

  it('hides header presets without a balance', () => {
    renderPanel({
      balance: undefined,
      presets: { placement: 'header', presets: [{ percentage: 25 }], onSelectPreset: vi.fn() },
    })
    expect(screen.queryByText('25%')).toBeNull()
  })

  it('renders the header accessory in place of header presets', () => {
    renderPanel({
      headerAccessory: <span>$100</span>,
      presets: { placement: 'header', presets: [{ percentage: 25 }], onSelectPreset: vi.fn() },
    })
    expect(screen.getByText('$100')).toBeTruthy()
    expect(screen.queryByText('25%')).toBeNull()
  })

  it('renders the label row for a header accessory without a label', () => {
    renderPanel({ label: undefined, headerAccessory: <span>$100</span> })
    expect(screen.getByText('$100')).toBeTruthy()
  })

  it('drops the token button when hidden and renders the accessory', () => {
    renderPanel({ tokenButton: { hidden: true, testID: 'choose-token' }, accessory: <span>slider</span> })
    expect(screen.queryByTestId('choose-token')).toBeNull()
    expect(screen.getByText('slider')).toBeTruthy()
  })

  it('routes the fiat line press to onPressDisabled while disabled', () => {
    const onPressDisabled = vi.fn()
    const onPressFiatValue = vi.fn()
    renderPanel({ disabled: true, onPressDisabled, onPressFiatValue })
    fireEvent.click(screen.getByText('$4,861.80'))
    expect(onPressFiatValue).not.toHaveBeenCalled()
    expect(onPressDisabled).toHaveBeenCalled()
  })
})
