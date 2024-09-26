import { Currency } from '@uniswap/sdk-core'
import { AppTFunction } from 'ui/src/i18n/types'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { WalletChainId } from 'uniswap/src/types/chains'
import { areCurrencyIdsEqual, buildWrappedNativeCurrencyId, currencyId } from 'uniswap/src/utils/currencyId'

export function getWrapType(
  inputCurrency: Currency | null | undefined,
  outputCurrency: Currency | null | undefined,
): WrapType {
  if (!inputCurrency || !outputCurrency || inputCurrency.chainId !== outputCurrency.chainId) {
    return WrapType.NotApplicable
  }

  const inputChainId = inputCurrency.chainId as WalletChainId
  const wrappedCurrencyId = buildWrappedNativeCurrencyId(inputChainId)

  if (inputCurrency.isNative && areCurrencyIdsEqual(currencyId(outputCurrency), wrappedCurrencyId)) {
    return WrapType.Wrap
  } else if (outputCurrency.isNative && areCurrencyIdsEqual(currencyId(inputCurrency), wrappedCurrencyId)) {
    return WrapType.Unwrap
  }

  return WrapType.NotApplicable
}

export function isWrapAction(wrapType: WrapType): wrapType is WrapType.Unwrap | WrapType.Wrap {
  return wrapType === WrapType.Unwrap || wrapType === WrapType.Wrap
}

export const getActionName = (t: AppTFunction, wrapType: WrapType): string => {
  switch (wrapType) {
    case WrapType.Unwrap:
      return t('swap.button.unwrap')
    case WrapType.Wrap:
      return t('swap.button.wrap')
    default:
      return t('swap.button.swap')
  }
}
