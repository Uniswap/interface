import { ethCurrencyInfo } from 'pages/Swap/Buy/BuyFormContext'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
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
    selectedCountry: {
      countryCode: 'US',
      displayName: 'United States',
      state: 'NY',
    },
    countryModalOpen: false,
    currencyModalOpen: false,
    providerModalOpen: true,
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
  setBuyFormState: jest.fn(),
}
