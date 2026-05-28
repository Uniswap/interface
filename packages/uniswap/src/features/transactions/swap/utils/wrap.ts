import { getFewTokenFromOriginalToken, isFewToken } from '@ring-protocol/few-v2-sdk'
import { Currency, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { areCurrencyIdsEqual, buildWrappedNativeCurrencyId, currencyId } from 'uniswap/src/utils/currencyId'

export function getWrapType(
  inputCurrency: Currency | null | undefined,
  outputCurrency: Currency | null | undefined,
): WrapType {
  if (!inputCurrency || !outputCurrency || inputCurrency.chainId !== outputCurrency.chainId) {
    return WrapType.NotApplicable
  }

  const inputChainId = inputCurrency.chainId as UniverseChainId
  const wrappedCurrencyId = buildWrappedNativeCurrencyId(inputChainId)

  if (inputCurrency.isNative && areCurrencyIdsEqual(currencyId(outputCurrency), wrappedCurrencyId)) {
    return WrapType.Wrap
  } else if (outputCurrency.isNative && areCurrencyIdsEqual(currencyId(inputCurrency), wrappedCurrencyId)) {
    return WrapType.Unwrap
  }

  const inputToken = inputCurrency.isNative ? inputCurrency.wrapped : (inputCurrency as Token)
  const outputToken = outputCurrency.isNative ? outputCurrency.wrapped : (outputCurrency as Token)

  if (!isFewToken(inputToken) && isFewToken(outputToken)) {
    const expectedFewToken = getFewTokenFromOriginalToken(inputToken, inputCurrency.chainId)
    if (areAddressesEqual(expectedFewToken.address, outputToken.address)) {
      return WrapType.FewWrap
    }
  } else if (isFewToken(inputToken) && !isFewToken(outputToken)) {
    const expectedFewToken = getFewTokenFromOriginalToken(outputToken, outputCurrency.chainId)
    if (areAddressesEqual(expectedFewToken.address, inputToken.address)) {
      return WrapType.FewUnwrap
    }
  }

  return WrapType.NotApplicable
}

export function isWrapAction(
  wrapType: WrapType,
): wrapType is WrapType.Unwrap | WrapType.Wrap | WrapType.FewWrap | WrapType.FewUnwrap {
  return (
    wrapType === WrapType.Unwrap ||
    wrapType === WrapType.Wrap ||
    wrapType === WrapType.FewWrap ||
    wrapType === WrapType.FewUnwrap
  )
}
