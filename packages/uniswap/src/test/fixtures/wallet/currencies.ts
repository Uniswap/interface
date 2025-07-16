import { ProtectionResult } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo, SafetyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { faker } from 'uniswap/src/test/shared'
import { createFixture } from 'uniswap/src/test/utils'
import { currencyId } from 'uniswap/src/utils/currencyId'

export const MAINNET_CURRENCY = NativeCurrency.onChain(UniverseChainId.SmartBCH)

type CurrencyInfoOptions = {
  nativeCurrency: NativeCurrency
}

export const benignSafetyInfo: SafetyInfo = {
  tokenList: TokenList.Default,
  protectionResult: ProtectionResult.Benign,
  blockaidFees: {
    buyFeePercent: 0,
    sellFeePercent: 0,
  },
}

export const currencyInfo = createFixture<CurrencyInfo, CurrencyInfoOptions>({
  nativeCurrency: MAINNET_CURRENCY,
})(({ nativeCurrency }) => ({
  currencyId: currencyId(nativeCurrency),
  currency: nativeCurrency,
  logoUrl: faker.image.imageUrl(),
  safetyInfo: benignSafetyInfo,
}))

export const ethCurrencyInfo = createFixture<CurrencyInfo>()(() =>
  currencyInfo({
    nativeCurrency: MAINNET_CURRENCY,
    logoUrl: 'https://token-icons.s3.amazonaws.com/eth.png',
  }),
)

export const usdcCurrencyInfo = createFixture<CurrencyInfo>()(() =>
  currencyInfo({
    nativeCurrency: BASE_CURRENCY,
    logoUrl: null,
  }),
)

export const ETH_CURRENCY_INFO = ethCurrencyInfo()

export const removeSafetyInfo = (item: Maybe<CurrencyInfo>): Maybe<CurrencyInfo> => {
  if (!item) {
    return item
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { safetyInfo: _, ...rest } = item
  return rest
}
