import { UniverseChainId, areAddressesEqual } from '@universe/chains'
import { useCallback } from 'react'
import { useAllCommonBaseCurrencies } from 'uniswap/src/components/TokenSelector/hooks/useAllCommonBaseCurrencies'
import { MELD_NATIVE_SOL_ADDRESS_SOLANA } from 'uniswap/src/features/chains/svm/defaults'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { ProtectionResult } from 'uniswap/src/features/dataApi/safety'
import { CurrencyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import { buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { FORSupportedToken } from 'uniswap/src/features/fiatOnRamp/types'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { fiatOnRampToCurrency, PricePoint } from '~/data/util'

// TODO(WEB-3839): replace all usage of Currency in the web app with CurrencyInfo

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
            protectionResult: ProtectionResult.Benign,
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
          protectionResult: ProtectionResult.Benign,
        },
        isSpam: false,
      })
    },
    [commonBases.data],
  )

  return { meldSupportedCurrencyToCurrencyInfo }
}

export type SparklineMap = { [key: string]: PricePoint[] | undefined }
