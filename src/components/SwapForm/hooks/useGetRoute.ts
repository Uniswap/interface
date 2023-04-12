import { ChainId, Currency, CurrencyAmount, Price, WETH } from '@kyberswap/ks-sdk-core'
import { debounce } from 'lodash'
import { useCallback, useMemo, useRef, useState } from 'react'
import routeApi from 'services/route'
import { GetRouteParams } from 'services/route/types/getRoute'

import useSelectedDexes from 'components/SwapForm/hooks/useSelectedDexes'
import { ETHER_ADDRESS, INPUT_DEBOUNCE_TIME, ZERO_ADDRESS_SOLANA } from 'constants/index'
import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import { useKyberswapGlobalConfig } from 'hooks/useKyberSwapConfig'
import { FeeConfig } from 'types/route'
import { Aggregator } from 'utils/aggregator'

export type ArgsGetRoute = {
  isSaveGas: boolean
  parsedAmount: CurrencyAmount<Currency> | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  feeConfig: FeeConfig | undefined
  customChain?: ChainId
}

export const getRouteTokenAddressParam = (currency: Currency) =>
  currency.isNative
    ? isEVM(currency.chainId)
      ? ETHER_ADDRESS
      : WETH[currency.chainId].address
    : currency.wrapped.address

const useGetRoute = (args: ArgsGetRoute) => {
  const [trigger, result] = routeApi.useLazyGetRouteQuery()
  const { aggregatorDomain, isEnableAuthenAggregator } = useKyberswapGlobalConfig()

  const { isSaveGas, parsedAmount, currencyIn, currencyOut, feeConfig, customChain } = args
  const { chainId: currentChain } = useActiveWeb3React()
  const chainId = customChain || currentChain

  const dexes = useSelectedDexes()
  const { chargeFeeBy = '', feeReceiver = '', feeAmount = '' } = feeConfig || {}
  const isInBps = feeConfig?.isInBps !== undefined ? (feeConfig.isInBps ? '1' : '0') : ''

  const triggerDebounced = useMemo(() => debounce(trigger, INPUT_DEBOUNCE_TIME), [trigger])

  const fetcher = useCallback(async () => {
    const amountIn = parsedAmount?.quotient?.toString() || ''

    if (
      !currencyIn ||
      !currencyOut ||
      !amountIn ||
      !parsedAmount?.currency?.equals(currencyIn) ||
      chainId === ChainId.SOLANA
    ) {
      return undefined
    }

    const tokenInAddress = getRouteTokenAddressParam(currencyIn)
    const tokenOutAddress = getRouteTokenAddressParam(currencyOut)

    const params: GetRouteParams = {
      tokenIn: tokenInAddress,
      tokenOut: tokenOutAddress,
      amountIn,
      saveGas: String(isSaveGas),
      includedSources: dexes,
      gasInclude: 'true', // default
      gasPrice: '', // default

      feeAmount,
      chargeFeeBy,
      isInBps,
      feeReceiver,
    }

    ;(Object.keys(params) as (keyof typeof params)[]).forEach(key => {
      if (!params[key]) {
        delete params[key]
      }
    })

    const url = `${aggregatorDomain}/${NETWORKS_INFO[chainId].aggregatorRoute}/api/v1/routes`

    triggerDebounced({
      url,
      params,
      authentication: isEnableAuthenAggregator,
    })

    return undefined
  }, [
    aggregatorDomain,
    chainId,
    chargeFeeBy,
    currencyIn,
    currencyOut,
    dexes,
    feeAmount,
    feeReceiver,
    isInBps,
    isSaveGas,
    parsedAmount?.currency,
    parsedAmount?.quotient,
    triggerDebounced,
    isEnableAuthenAggregator,
  ])

  return { fetcher, result }
}

export const useGetRouteSolana = (args: ArgsGetRoute) => {
  const { parsedAmount, currencyIn, currencyOut, customChain } = args
  const { account } = useActiveWeb3React()
  const controller = useRef(new AbortController())

  const { aggregatorAPI } = useKyberswapGlobalConfig()
  const [price, setPrice] = useState<Price<Currency, Currency> | null>(null)

  const debounceAmount = useDebounce(parsedAmount, INPUT_DEBOUNCE_TIME)

  const fetcherWithoutDebounce = useCallback(async () => {
    const amountIn = debounceAmount?.quotient?.toString() || ''

    if (
      !currencyIn ||
      !currencyOut ||
      !amountIn ||
      !debounceAmount?.currency?.equals(currencyIn) ||
      customChain !== ChainId.SOLANA
    ) {
      setPrice(null)
      return
    }
    controller.current.abort()
    controller.current = new AbortController()
    const to = account ?? ZERO_ADDRESS_SOLANA
    const signal = controller.current.signal
    const result = await Aggregator.baseTradeSolana({
      aggregatorAPI,
      currencyAmountIn: debounceAmount,
      currencyOut,
      to,
      signal,
    })
    setPrice(result)
  }, [currencyIn, currencyOut, debounceAmount, account, aggregatorAPI, customChain])

  const fetcher = useMemo(() => debounce(fetcherWithoutDebounce, INPUT_DEBOUNCE_TIME), [fetcherWithoutDebounce])

  return { fetcher, result: price }
}

export default useGetRoute
