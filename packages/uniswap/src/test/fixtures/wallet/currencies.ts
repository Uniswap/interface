import { Currency } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo, SafetyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import { faker } from 'uniswap/src/test/shared'
import { createFixture } from 'uniswap/src/test/utils'
import { currencyId } from 'uniswap/src/utils/currencyId'

export const MAINNET_CURRENCY = nativeOnChain(UniverseChainId.Mainnet)
export const BASE_CURRENCY = nativeOnChain(UniverseChainId.Base)
export const ARBITRUM_CURRENCY = nativeOnChain(UniverseChainId.ArbitrumOne)
export const MONAD_TESTNET_CURRENCY = nativeOnChain(UniverseChainId.MonadTestnet)
export const OPTIMISM_CURRENCY = nativeOnChain(UniverseChainId.Optimism)
export const POLYGON_CURRENCY = nativeOnChain(UniverseChainId.Polygon)
export const CELO_CURRENCY = nativeOnChain(UniverseChainId.Celo)
export const AVALANCHE_CURRENCY = nativeOnChain(UniverseChainId.Avalanche)
export const WORLD_CHAIN_CURRENCY = nativeOnChain(UniverseChainId.WorldChain)
export const ZORA_CURRENCY = nativeOnChain(UniverseChainId.Zora)
export const ZKSYNC_CURRENCY = nativeOnChain(UniverseChainId.Zksync)

type CurrencyInfoOptions = {
  nativeCurrency: Currency
}

export const benignSafetyInfo: SafetyInfo = {
  tokenList: TokenList.Default,
  protectionResult: GraphQLApi.ProtectionResult.Benign,
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

export const uniCurrencyInfo = createFixture<CurrencyInfo>()(() =>
  currencyInfo({
    nativeCurrency: MAINNET_CURRENCY,
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
  }),
)

export const daiCurrencyInfo = createFixture<CurrencyInfo>()(() =>
  currencyInfo({
    nativeCurrency: MAINNET_CURRENCY,
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
  }),
)

export const arbitrumDaiCurrencyInfo = createFixture<CurrencyInfo>()(() =>
  currencyInfo({
    nativeCurrency: ARBITRUM_CURRENCY,
    logoUrl:
      'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
  }),
)

export const usdcCurrencyInfo = createFixture<CurrencyInfo>()(() =>
  currencyInfo({
    nativeCurrency: BASE_CURRENCY,
    logoUrl: null,
  }),
)

export const ETH_CURRENCY_INFO = ethCurrencyInfo()
export const UNI_CURRENCY_INFO = uniCurrencyInfo()
export const DAI_CURRENCY_INFO = daiCurrencyInfo()
export const ARBITRUM_DAI_CURRENCY_INFO = arbitrumDaiCurrencyInfo()
export const USDC_CURRENCY_INFO = usdcCurrencyInfo()

export const removeSafetyInfo = (item: Maybe<CurrencyInfo>): Maybe<CurrencyInfo> => {
  if (!item) {
    return item
  }
  const { safetyInfo: _, ...rest } = item
  return rest
}
