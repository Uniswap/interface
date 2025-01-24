import { PricePoint, fiatOnRampToCurrency, gqlToCurrency } from 'graphql/data/util'
import { COMMON_BASES, buildPartialCurrencyInfo } from 'uniswap/src/constants/routing'
import { USDC_OPTIMISM } from 'uniswap/src/constants/tokens'
import {
  Token as GqlToken,
  ProtectionResult,
  SafetyLevel,
  TopTokens100Query,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId, isUniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import { buildCurrencyInfo, getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils'
import { FORSupportedToken } from 'uniswap/src/features/fiatOnRamp/types'
import { isSameAddress } from 'utilities/src/addresses'
import { currencyId } from 'utils/currencyId'

// TODO(WEB-3839): replace all usage of Currency in the web app with CurrencyInfo

// TODO: remove this function once we have it in the shared package
export function gqlTokenToCurrencyInfo(token?: GqlToken): CurrencyInfo | undefined {
  if (!token) {
    return undefined
  }

  const currency = gqlToCurrency(token)

  if (!currency) {
    return undefined
  }

  const currencyInfo: CurrencyInfo = buildCurrencyInfo({
    currency,
    currencyId: currencyId(currency),
    logoUrl: token.project?.logo?.url ?? token.project?.logoUrl,
    safetyLevel: token.project?.safetyLevel ?? SafetyLevel.StrongWarning,
    isSpam: token.project?.isSpam ?? false,
    safetyInfo: getCurrencySafetyInfo(token.project?.safetyLevel, token.protectionInfo),
  })
  return currencyInfo
}

export function meldSupportedCurrencyToCurrencyInfo(forCurrency: FORSupportedToken): CurrencyInfo | undefined {
  if (!isUniverseChainId(Number(forCurrency.chainId))) {
    return undefined
  }

  const supportedChainId = Number(forCurrency.chainId) as UniverseChainId
  const commonBases = COMMON_BASES[supportedChainId]

  const currencyInfo = commonBases.find((base) => {
    if (base.currency.isNative) {
      return !forCurrency.address
    }
    return isSameAddress(base.currency.address, forCurrency.address)
  })

  if (currencyInfo) {
    return {
      ...currencyInfo,
      logoUrl: forCurrency.symbol,
    }
  }

  // Special case for *bridged* USDC on Optimism, which we otherwise don't use in our app.
  if (isSameAddress(forCurrency.address, '0x7f5c764cbc14f9669b88837ca1490cca17c31607')) {
    return buildPartialCurrencyInfo(USDC_OPTIMISM)
  }

  const currency = fiatOnRampToCurrency(forCurrency)
  if (!currency) {
    return undefined
  }
  return buildCurrencyInfo({
    currency,
    currencyId: currencyId(currency),
    logoUrl: forCurrency.symbol,
    safetyLevel: SafetyLevel.Verified,
    safetyInfo: {
      tokenList: TokenList.Default,
      protectionResult: ProtectionResult.Benign,
    },
    isSpam: false,
  })
}

export type SparklineMap = { [key: string]: PricePoint[] | undefined }
export type TopToken = NonNullable<NonNullable<TopTokens100Query>['topTokens']>[number]
