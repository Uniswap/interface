import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { DAI, nativeOnChain, USDC, WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { Locale } from 'uniswap/src/features/language/constants'
import { mockLocalizedFormatter } from 'uniswap/src/test/mocks'
import {
  getCurrencyDisplayText,
  getFormattedCurrencyAmount,
  getSymbolDisplayText,
  getWrappedAmountIfExists,
  getWrappedTokenIfExists,
} from 'uniswap/src/utils/currency'
import { noOpFunction } from 'utilities/src/test/utils'

const mockFormatter = mockLocalizedFormatter(Locale.EnglishUnitedStates)

describe(getFormattedCurrencyAmount, () => {
  it('formats valid amount', () => {
    expect(
      getFormattedCurrencyAmount({ currency: DAI, amount: '1000000000000000000', formatter: mockFormatter }),
    ).toEqual('1.00 ')
  })

  it('handles invalid Currency', () => {
    expect(getFormattedCurrencyAmount({ currency: undefined, amount: '1', formatter: mockFormatter })).toEqual('')
    expect(getFormattedCurrencyAmount({ currency: null, amount: '1', formatter: mockFormatter })).toEqual('')
  })

  it('handles error', () => {
    // invalid raw amount will throw error
    vi.spyOn(console, 'error').mockImplementation(noOpFunction)
    expect(getFormattedCurrencyAmount({ currency: USDC, amount: '0.1', formatter: mockFormatter })).toEqual('')
  })
})

describe(getSymbolDisplayText, () => {
  it('truncates past the default 6-character cap', () => {
    expect(getSymbolDisplayText('PONSHIBA')).toEqual('PONSH…')
    expect(getSymbolDisplayText('WSTETH')).toEqual('WSTETH')
  })

  it('respects a custom cap', () => {
    expect(getSymbolDisplayText('PONSHIBA', 10)).toEqual('PONSHIBA')
    expect(getSymbolDisplayText('ABCDEFGHIJK', 10)).toEqual('ABCDEFGHI…')
  })

  it('passes through nullish symbols', () => {
    expect(getSymbolDisplayText(undefined)).toBeUndefined()
    expect(getSymbolDisplayText(null)).toBeNull()
  })
})

describe(getCurrencyDisplayText, () => {
  it('Returns symbol for token', () => {
    expect(getCurrencyDisplayText(DAI, DAI.address)).toEqual('DAI')
  })

  it('handles undefined currency with address', () => {
    expect(getCurrencyDisplayText(undefined, DAI.address)).toEqual('0x6B17...1d0F')
  })

  it('handles undefined address with currency', () => {
    expect(getCurrencyDisplayText(DAI, undefined)).toEqual('DAI')
  })
})

// Arc and Tempo are the only chains with `wrappedNativeCurrency: null`; their native currency's
// `.wrapped` getter throws `Unsupported chain ID` rather than returning undefined.
const CHAINS_WITHOUT_WRAPPED_NATIVE = [
  ['Arc', UniverseChainId.Arc],
  ['Tempo', UniverseChainId.Tempo],
] as const

// Compile-time assertions for the overloads: a Token narrows to Token and a nullish input to
// undefined, while a Currency that may be native stays optional because on Arc/Tempo it is.
const _tokenNarrows: Token = getWrappedTokenIfExists(DAI)
const _nullishNarrows: undefined = getWrappedTokenIfExists(undefined)
const _currencyStaysOptional: Token | undefined = getWrappedTokenIfExists(DAI as Currency)
const _amountNarrows: CurrencyAmount<Token> = getWrappedAmountIfExists(CurrencyAmount.fromRawAmount(DAI, '1'))
void [_tokenNarrows, _nullishNarrows, _currencyStaysOptional, _amountNarrows]

describe('getWrappedTokenIfExists', () => {
  it('returns nullish input as undefined', () => {
    expect(getWrappedTokenIfExists(undefined)).toBeUndefined()
    expect(getWrappedTokenIfExists(null)).toBeUndefined()
  })

  it('returns a token as itself', () => {
    expect(getWrappedTokenIfExists(DAI)).toBe(DAI)
    expect(getWrappedTokenIfExists(USDC)).toBe(USDC)
  })

  it('returns the wrapped native for a native currency', () => {
    const wrapped = getWrappedTokenIfExists(nativeOnChain(UniverseChainId.Mainnet))

    expect(wrapped?.address).toBe('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
    // Same instance `.wrapped` would return, so identity comparisons keep working.
    expect(wrapped).toBe(WRAPPED_NATIVE_CURRENCY[UniverseChainId.Mainnet])
  })

  it.each(CHAINS_WITHOUT_WRAPPED_NATIVE)('returns undefined for native on %s instead of throwing', (_name, chainId) => {
    const native = nativeOnChain(chainId)

    expect(() => native.wrapped).toThrow('Unsupported chain ID')
    expect(getWrappedTokenIfExists(native)).toBeUndefined()
  })
})

describe('getWrappedAmountIfExists', () => {
  it('returns nullish input as undefined', () => {
    expect(getWrappedAmountIfExists(undefined)).toBeUndefined()
    expect(getWrappedAmountIfExists(null)).toBeUndefined()
  })

  it('returns a token amount unchanged', () => {
    const amount = CurrencyAmount.fromRawAmount(DAI, '1000')

    expect(getWrappedAmountIfExists(amount)).toBe(amount)
  })

  it('re-denominates a native amount in the wrapped native, preserving the raw value', () => {
    const amount = CurrencyAmount.fromRawAmount(nativeOnChain(UniverseChainId.Mainnet), '1000')
    const wrapped = getWrappedAmountIfExists(amount)

    expect(wrapped?.currency).toBe(WRAPPED_NATIVE_CURRENCY[UniverseChainId.Mainnet])
    expect(wrapped?.quotient.toString()).toBe('1000')
  })

  it.each(CHAINS_WITHOUT_WRAPPED_NATIVE)('returns undefined for a native amount on %s', (_name, chainId) => {
    const amount = CurrencyAmount.fromRawAmount(nativeOnChain(chainId), '1000')

    expect(() => amount.wrapped).toThrow('Unsupported chain ID')
    expect(getWrappedAmountIfExists(amount)).toBeUndefined()
  })
})
