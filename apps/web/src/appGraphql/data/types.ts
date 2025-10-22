import { fiatOnRampToCurrency, gqlToCurrency, PricePoint } from 'appGraphql/data/util'
import { GraphQLApi } from '@universe/api'
import { useCallback } from 'react'
import { useAllCommonBaseCurrencies } from 'uniswap/src/components/TokenSelector/hooks/useAllCommonBaseCurrencies'
import { MELD_NATIVE_SOL_ADDRESS_SOLANA } from 'uniswap/src/features/chains/svm/defaults'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import { buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils/getCurrencySafetyInfo'
import { FORSupportedToken } from 'uniswap/src/features/fiatOnRamp/types'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { currencyId } from 'uniswap/src/utils/currencyId'

// TODO(WEB-3839): replace all usage of Currency in the web app with CurrencyInfo

// TODO: remove this function once we have it in the shared package
export function gqlTokenToCurrencyInfo(token?: GraphQLApi.Token): CurrencyInfo | undefined {
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
    isSpam: token.project?.isSpam ?? false,
    safetyInfo: getCurrencySafetyInfo(
      token.project?.safetyLevel ?? GraphQLApi.SafetyLevel.StrongWarning,
      token.protectionInfo,
    ),
  })
  return currencyInfo
}

export function useMeldSupportedCurrencyToCurrencyInfo(): {
  meldSupportedCurrencyToCurrencyInfo?: (forCurrency: FORSupportedToken) => CurrencyInfo | undefined
} {
  const commonBases = useAllCommonBaseCurrencies()

  const meldSupportedCurrencyToCurrencyInfo = useCallback(
    (forCurrency: FORSupportedToken): CurrencyInfo | undefined => {
      if (!isUniverseChainId(Number(forCurrency.chainId))) {
        return undefined
      }

      const supportedChainId = Number(forCurrency.chainId) as UniverseChainId
      const currencyInfo = commonBases.data?.find((base) => {
        if (base.currency.isNative) {
          if (base.currency.chainId === supportedChainId) {
            return !forCurrency.address || forCurrency.address === MELD_NATIVE_SOL_ADDRESS_SOLANA
          } else {
            return false
          }
        }
        return areAddressesEqual({
          addressInput1: { address: base.currency.address, chainId: base.currency.chainId },
          addressInput2: { address: forCurrency.address, chainId: supportedChainId },
        })
      })

      if (currencyInfo) {
        return {
          ...currencyInfo,
          logoUrl: forCurrency.symbol,
          safetyInfo: {
            tokenList: TokenList.Default,
            protectionResult: GraphQLApi.ProtectionResult.Benign,
          },
          isSpam: false,
        }
      }

      const currency = fiatOnRampToCurrency(forCurrency)
      if (!currency) {
        return undefined
      }
      return buildCurrencyInfo({
        currency,
        currencyId: currencyId(currency),
        logoUrl: forCurrency.symbol,
        safetyInfo: {
          tokenList: TokenList.Default,
          protectionResult: GraphQLApi.ProtectionResult.Benign,
        },
        isSpam: false,
      })
    },
    [commonBases.data],
  )

  return { meldSupportedCurrencyToCurrencyInfo }
}

export type SparklineMap = { [key: string]: PricePoint[] | undefined }
