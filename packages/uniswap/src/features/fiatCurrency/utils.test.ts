import { getCurrencies } from 'react-native-localize'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { getDeviceFiatCurrency } from 'uniswap/src/features/fiatCurrency/utils'
import { vi } from 'vitest'

vi.mock('react-native-localize', () => ({ getCurrencies: vi.fn() }))

const mockGetCurrencies = vi.mocked(getCurrencies)

describe(getDeviceFiatCurrency, () => {
  it('returns the first device currency when supported', () => {
    mockGetCurrencies.mockReturnValue(['GBP', 'USD'])
    expect(getDeviceFiatCurrency()).toBe(FiatCurrency.BritishPound)
  })

  it('skips unsupported device currencies', () => {
    mockGetCurrencies.mockReturnValue(['THB', 'EUR'])
    expect(getDeviceFiatCurrency()).toBe(FiatCurrency.Euro)
  })

  it('falls back to USD when no device currency is supported', () => {
    mockGetCurrencies.mockReturnValue([])
    expect(getDeviceFiatCurrency()).toBe(FiatCurrency.UnitedStatesDollar)
  })

  it('falls back to USD when the device lookup throws', () => {
    mockGetCurrencies.mockImplementation(() => {
      throw new Error('unavailable')
    })
    expect(getDeviceFiatCurrency()).toBe(FiatCurrency.UnitedStatesDollar)
  })
})
