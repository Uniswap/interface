import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { useLocation } from 'react-router-dom'

import { DEFAULT_OUTPUT_TOKEN_BY_CHAIN, NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useCurrencyV2 } from 'hooks/Tokens'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { Field } from 'state/swap/actions'
import { queryParametersToSwapState } from 'state/swap/hooks'

const useDefaultsTokenFromURLSearch = (
  currentTokenIn: Currency | undefined,
  currentTokenOut: Currency | undefined,
  pagePath: string,
  customChain?: ChainId,
) => {
  const { chainId: currentChain } = useActiveWeb3React()
  const chainId = customChain || currentChain

  const parsedQs = useParsedQueryString()
  const storedInputValue = currentTokenIn?.chainId === chainId ? currentTokenIn : undefined
  const storedOutputValue = currentTokenOut?.chainId === chainId ? currentTokenOut : undefined
  const { pathname } = useLocation()
  const parsed = queryParametersToSwapState(parsedQs, chainId, pathname.startsWith(pagePath))

  const outputCurrencyAddress = chainId ? DEFAULT_OUTPUT_TOKEN_BY_CHAIN[chainId]?.address ?? '' : ''

  const parsedInputValue = parsed[Field.INPUT].currencyId // default inputCurrency is the native token
  const parsedOutputValue = parsed[Field.OUTPUT].currencyId || outputCurrencyAddress || ''

  const inputCurrencyId = parsedQs.inputCurrency ? parsedInputValue : storedInputValue || parsedInputValue
  let outputCurrencyId = parsedQs.outputCurrency ? parsedOutputValue : storedOutputValue || parsedOutputValue

  const native = chainId ? NativeCurrencies[chainId].symbol : ''
  if (native && outputCurrencyId === native && inputCurrencyId === native) {
    outputCurrencyId = outputCurrencyAddress
  }

  // if currency is object, no need to call
  const inputCurrency =
    useCurrencyV2(inputCurrencyId && typeof inputCurrencyId === 'object' ? '' : inputCurrencyId, chainId) ??
    storedInputValue
  const outputCurrency =
    useCurrencyV2(outputCurrencyId && typeof outputCurrencyId === 'object' ? '' : outputCurrencyId, chainId) ??
    storedOutputValue

  return { inputCurrency, outputCurrency }
}
export default useDefaultsTokenFromURLSearch
