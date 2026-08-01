import { Token } from '@uniswap/sdk-core'
import {
  AmountEntrySection,
  DepositSourceMenuItem,
  EarnHelpIconButton,
  getAmountEntrySpacing,
  getFormattedAlternateAmount,
} from 'src/components/earn/EarnDepositAmountControls'
import { fireEvent, render, screen } from 'src/test/test-utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { EarnDepositSourceOption } from 'uniswap/src/features/earn/types'
import type { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'
import { ON_PRESS_EVENT_PAYLOAD } from 'uniswap/src/test/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { formatNumberOrString } from 'utilities/src/format/localeBased'
import { NumberType } from 'utilities/src/format/types'

const FIAT_CURRENCY_INFO = {
  symbol: '$',
  code: 'USD',
  name: 'US Dollar',
  shortName: 'USD',
  groupingSeparator: ',',
  decimalSeparator: '.',
  fullSymbol: '$',
  symbolAtFront: true,
} as FiatCurrencyInfo

function renderAmountEntrySection(overrides?: Partial<Parameters<typeof AmountEntrySection>[0]>): void {
  render(
    <AmountEntrySection
      fiatCurrencyInfo={FIAT_CURRENCY_INFO}
      fontSize={40}
      formattedAlternateAmount=""
      hasAmount={false}
      inputRef={{ current: null }}
      isFiatInput
      isShortMobileDevice={false}
      maxDecimals={2}
      maxLabel="Max"
      symbol="ETH"
      value="10"
      onInputLayout={vi.fn()}
      onPercentPress={vi.fn()}
      onToggleInputMode={vi.fn()}
      setActiveAmount={vi.fn()}
      {...overrides}
    />,
  )
}

describe(EarnHelpIconButton, () => {
  it('opens the vault details when pressed', (): void => {
    const onPress = vi.fn()

    render(<EarnHelpIconButton onPress={onPress} />)
    fireEvent.press(screen.getByTestId(TestID.HelpIcon), ON_PRESS_EVENT_PAYLOAD)

    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
describe(DepositSourceMenuItem, (): void => {
  it('uses the canonical token name above the network-specific label', (): void => {
    const currency = new Token(
      UniverseChainId.Zora,
      '0x0000000000000000000000000000000000000001',
      18,
      'ETH',
      'Zora ETH',
    )
    const option = {
      id: 'zora-eth',
      chainId: UniverseChainId.Zora,
      currencyInfo: {
        currency,
        currencyId: `${UniverseChainId.Zora}-${currency.address}`,
        logoUrl: null,
      },
      balanceQuantity: 1,
      balanceUsd: 100,
    } satisfies EarnDepositSourceOption

    render(<DepositSourceMenuItem canonicalTokenName="Ethereum" option={option} />)

    expect(screen.getByText('Ethereum')).toBeTruthy()
    expect(screen.getByText('Zora Network ETH')).toBeTruthy()
  })
})

describe(AmountEntrySection, (): void => {
  it('renders the heading-styled fiat prefix for a populated amount', (): void => {
    renderAmountEntrySection()

    expect((screen.getByTestId(TestID.EarnAmountSymbol) as unknown as HTMLInputElement).value).toBe('$')
  })

  it('keeps the same fiat prefix mounted for the empty placeholder', (): void => {
    renderAmountEntrySection({ value: '' })

    expect((screen.getByTestId(TestID.EarnAmountSymbol) as unknown as HTMLInputElement).value).toBe('$')
  })

  it('renders the token symbol as the suffix in crypto input mode', (): void => {
    renderAmountEntrySection({ isFiatInput: false })

    expect((screen.getByTestId(TestID.EarnAmountSymbol) as unknown as HTMLInputElement).value).toBe(' ETH')
  })
})

describe(getFormattedAlternateAmount, (): void => {
  it('rounds the inactive token amount with the standard non-transaction formatter', (): void => {
    expect(
      getFormattedAlternateAmount({
        isFiatInput: true,
        exactAmountFiat: '12.77',
        exactAmountToken: '0.007292684776430298',
        symbol: 'ETH',
        currencyCode: FIAT_CURRENCY_INFO.code,
        formatNumberOrString: ({ value, type, currencyCode, placeholder }) =>
          formatNumberOrString({
            price: value,
            locale: 'en-US',
            type: type ?? NumberType.TokenNonTx,
            currencyCode,
            placeholder,
          }),
      }),
    ).toBe('0.007 ETH')
  })
})

describe(getAmountEntrySpacing, (): void => {
  it('keeps the default spacing on larger phones even with an inline error', (): void => {
    expect(getAmountEntrySpacing({ isShortMobileDevice: false, hasInlineError: true })).toEqual({
      errorGap: '$spacing12',
      pb: '$spacing16',
    })
  })

  it('compacts spacing on short phones only when the inline error is present', (): void => {
    expect(getAmountEntrySpacing({ isShortMobileDevice: true, hasInlineError: true })).toEqual({
      errorGap: '$spacing4',
      pb: '$none',
    })
  })

  it('keeps the default spacing on short phones without an inline error', (): void => {
    expect(getAmountEntrySpacing({ isShortMobileDevice: true, hasInlineError: false })).toEqual({
      errorGap: '$spacing12',
      pb: '$spacing16',
    })
  })
})

describe(getFormattedAlternateAmount, (): void => {
  it('rounds the inactive token amount with the standard token formatter', (): void => {
    const formatNumberOrString = vi.fn(() => '0.007293')

    expect(
      getFormattedAlternateAmount({
        isFiatInput: true,
        exactAmountFiat: '12.34',
        exactAmountToken: '0.007292684776430298',
        symbol: 'ETH',
        currencyCode: 'USD',
        formatNumberOrString,
      }),
    ).toBe('0.007293 ETH')
    expect(formatNumberOrString).toHaveBeenCalledWith({
      value: '0.007292684776430298',
      type: NumberType.TokenNonTx,
    })
  })

  it('rounds the inactive fiat amount with the standard fiat formatter', (): void => {
    const formatNumberOrString = vi.fn(() => '$12.35')

    expect(
      getFormattedAlternateAmount({
        isFiatInput: false,
        exactAmountFiat: '12.34567',
        exactAmountToken: '0.01',
        symbol: 'ETH',
        currencyCode: 'EUR',
        formatNumberOrString,
      }),
    ).toBe('$12.35')
    expect(formatNumberOrString).toHaveBeenCalledWith({
      value: '12.34567',
      type: NumberType.FiatStandard,
      currencyCode: 'EUR',
    })
  })
})
