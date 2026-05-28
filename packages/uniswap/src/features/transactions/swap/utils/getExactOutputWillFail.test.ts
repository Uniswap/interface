import { renderHook } from '@testing-library/react'
import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrency } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { getExactOutputWillFail } from 'uniswap/src/features/transactions/swap/utils/getExactOutputWillFail'
import { SAMPLE_CURRENCY_ID_1 } from 'uniswap/src/test/fixtures'
import { CurrencyField } from 'uniswap/src/types/currency'

describe('getExactOutputWillFail', () => {
  const createToken = (buyFeeBps?: string, sellFeeBps?: string): Token =>
    buildCurrency({
      chainId: 1,
      address: '0x4d224452801aced8b2f0aebe155379bb5d594381',
      decimals: 18,
      symbol: 'TEST',
      name: 'Test',
      buyFeeBps,
      sellFeeBps,
    }) as Token

  const createSolanaToken = (): Token => {
    return buildCurrency({
      chainId: UniverseChainId.Solana,
      address: 'So11111111111111111111111111111111111111112',
      decimals: 9,
      symbol: 'SOL',
      name: 'Solana',
    }) as Token
  }

  const createCurrencyInfo = (currency: Token): CurrencyInfo => {
    return {
      currency,
      logoUrl: undefined,
      currencyId: SAMPLE_CURRENCY_ID_1,
    }
  }

  it('returns false for all flags when no fees are present', () => {
    const { result } = renderHook(() =>
      getExactOutputWillFail({
        currencies: {
          [CurrencyField.INPUT]: createCurrencyInfo(createToken()),
          [CurrencyField.OUTPUT]: createCurrencyInfo(createToken()),
        },
      }),
    )
    expect(result.current).toEqual({
      outputTokenHasBuyTax: false,
      exactOutputWillFail: false,
      exactOutputWouldFailIfCurrenciesSwitched: false,
    })
  })

  it('returns true for exactOutputWillFail when input token has sell tax', () => {
    const { result } = renderHook(() =>
      getExactOutputWillFail({
        currencies: {
          [CurrencyField.INPUT]: createCurrencyInfo(createToken(undefined, '100')),
          [CurrencyField.OUTPUT]: createCurrencyInfo(createToken()),
        },
      }),
    )
    expect(result.current.exactOutputWillFail).toBe(true)
  })

  it('returns true for outputTokenHasBuyTax when output token has buy tax', () => {
    const { result } = renderHook(() =>
      getExactOutputWillFail({
        currencies: {
          [CurrencyField.INPUT]: createCurrencyInfo(createToken()),
          [CurrencyField.OUTPUT]: createCurrencyInfo(createToken('100')),
        },
      }),
    )
    expect(result.current.outputTokenHasBuyTax).toBe(true)
  })

  it('returns true for exactOutputWouldFailIfCurrenciesSwitched when input token has buy tax', () => {
    const { result } = renderHook(() =>
      getExactOutputWillFail({
        currencies: {
          [CurrencyField.INPUT]: createCurrencyInfo(createToken('100')),
          [CurrencyField.OUTPUT]: createCurrencyInfo(createToken()),
        },
      }),
    )
    expect(result.current.exactOutputWouldFailIfCurrenciesSwitched).toBe(true)
  })

  it('returns true for exactOutputWouldFailIfCurrenciesSwitched when output token has sell tax', () => {
    const { result } = renderHook(() =>
      getExactOutputWillFail({
        currencies: {
          [CurrencyField.INPUT]: createCurrencyInfo(createToken()),
          [CurrencyField.OUTPUT]: createCurrencyInfo(createToken(undefined, '100')),
        },
      }),
    )
    expect(result.current.exactOutputWouldFailIfCurrenciesSwitched).toBe(true)
  })

  describe('Solana tokens', () => {
    it('returns true for exactOutputWillFail when input is Solana token', () => {
      const { result } = renderHook(() =>
        getExactOutputWillFail({
          currencies: {
            [CurrencyField.INPUT]: createCurrencyInfo(createSolanaToken()),
            [CurrencyField.OUTPUT]: createCurrencyInfo(createToken()),
          },
        }),
      )
      expect(result.current.exactOutputWillFail).toBe(true)
      expect(result.current.exactOutputWouldFailIfCurrenciesSwitched).toBe(true)
      expect(result.current.outputTokenHasBuyTax).toBe(false)
    })

    it('returns true for exactOutputWillFail when output is Solana token', () => {
      const { result } = renderHook(() =>
        getExactOutputWillFail({
          currencies: {
            [CurrencyField.INPUT]: createCurrencyInfo(createToken()),
            [CurrencyField.OUTPUT]: createCurrencyInfo(createSolanaToken()),
          },
        }),
      )
      expect(result.current.exactOutputWillFail).toBe(true)
      expect(result.current.exactOutputWouldFailIfCurrenciesSwitched).toBe(true)
      expect(result.current.outputTokenHasBuyTax).toBe(false)
    })

    it('returns true for exactOutputWillFail when both are Solana tokens', () => {
      const { result } = renderHook(() =>
        getExactOutputWillFail({
          currencies: {
            [CurrencyField.INPUT]: createCurrencyInfo(createSolanaToken()),
            [CurrencyField.OUTPUT]: createCurrencyInfo(createSolanaToken()),
          },
        }),
      )
      expect(result.current.exactOutputWillFail).toBe(true)
      expect(result.current.exactOutputWouldFailIfCurrenciesSwitched).toBe(true)
      expect(result.current.outputTokenHasBuyTax).toBe(false)
    })
  })
})
