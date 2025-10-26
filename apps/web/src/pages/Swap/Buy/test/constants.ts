import { ethCurrencyInfo } from 'pages/Swap/Buy/BuyFormContext'
import { RampDirection } from 'uniswap/src/features/fiatOnRamp/types'
import { getFiatCurrencyComponents } from 'utilities/src/format/localeBased'

export const mockServiceProvider = {
  serviceProvider: 'test-provider',
  name: 'Test Provider',
  url: 'test.provider',
  logos: {
    darkLogo: 'test-provider-logo-dark',
    lightLogo: 'test-provider-logo-light',
  },
  paymentMethods: ['Credit Card'],
}

export const mockBuyFormContext = {
  buyFormState: {
    quoteCurrency: {
      currencyInfo: ethCurrencyInfo,
      meldCurrencyCode: 'ETH',
    },
    inputAmount: '100',
    inputInFiat: true,
    selectedCountry: {
      countryCode: 'US',
      displayName: 'United States',
      state: 'NY',
    },
    countryModalOpen: false,
    currencyModalOpen: false,
    providerModalOpen: true,
    rampDirection: RampDirection.ONRAMP,
  },
  derivedBuyFormInfo: {
    meldSupportedFiatCurrency: {
      ...getFiatCurrencyComponents('en-US', 'USD'),
      symbol: '$',
      name: 'United States Dollar',
      shortName: 'USD',
      code: 'USD',
    },
    notAvailableInThisRegion: false,
    fetchingQuotes: false,
  },
  setBuyFormState: vi.fn(),
}
