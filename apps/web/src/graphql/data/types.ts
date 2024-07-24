import { SupportedInterfaceChainId, isSupportedChainId } from 'constants/chains'
import { COMMON_BASES, buildCurrencyInfo } from 'constants/routing'
import { USDC_OPTIMISM } from 'constants/tokens'
import { fiatOnRampToCurrency, gqlToCurrency } from 'graphql/data/util'
import { Token as GqlToken, SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
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

  const currencyInfo: CurrencyInfo = {
    currency,
    currencyId: currencyId(currency),
    logoUrl: token.project?.logo?.url ?? token.project?.logoUrl,
    safetyLevel: token.project?.safetyLevel ?? SafetyLevel.StrongWarning,
    isSpam: token.project?.isSpam ?? false,
  }
  return currencyInfo
}

export function meldSupportedCurrencyToCurrencyInfo(forCurrency: FORSupportedToken): CurrencyInfo | undefined {
  if (!isSupportedChainId(Number(forCurrency.chainId))) {
    return
  }

  const supportedChainId = Number(forCurrency.chainId) as SupportedInterfaceChainId
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
    return buildCurrencyInfo(USDC_OPTIMISM)
  }

  const currency = fiatOnRampToCurrency(forCurrency)
  if (!currency) {
    return
  }
  return {
    currency,
    currencyId: currencyId(currency),
    logoUrl: forCurrency.symbol,
    safetyLevel: SafetyLevel.Verified,
    isSpam: false,
  }
}
