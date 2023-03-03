import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { stringify } from 'querystring'
import { useCallback, useEffect, useRef } from 'react'
import { Params, useLocation, useNavigate, useParams } from 'react-router-dom'

import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { filterTokensWithExactKeyword } from 'utils/filtering'
import { convertToSlug, getSymbolSlug } from 'utils/string'
import { convertSymbol } from 'utils/tokenInfo'

import { useAllTokens, useIsLoadedTokenDefault } from './Tokens'
import useParsedQueryString from './useParsedQueryString'

type TokenSymbolUrl = {
  fromCurrency: string
  toCurrency: string
  network: string
}
const getUrlMatchParams = (params: Params): TokenSymbolUrl => {
  const fromCurrency = (params.fromCurrency || '').toLowerCase()
  const toCurrency = (params.toCurrency || '').toLowerCase()
  const network: string = convertToSlug(params.network || '')
  return { fromCurrency, toCurrency, network }
}

const getTokenPath = (symA: string, symB: string) => [symA, symB].join('-to-')

/** check url params format `/network/x-to-y` and then auto select token input */
export default function useSyncTokenSymbolToUrl(
  currencyIn: Currency | undefined,
  currencyOut: Currency | undefined,
  onCurrencySelection: (fromToken: Currency | undefined, toToken?: Currency, amount?: string) => void,
  isSelectCurrencyManual: boolean,
  disabled = false,
) {
  const params = useParams()
  const { fromCurrency, toCurrency, network } = getUrlMatchParams(params)
  const { chainId } = useActiveWeb3React()
  const navigate = useNavigate()
  const qs = useParsedQueryString()
  const { pathname } = useLocation()
  const allTokens = useAllTokens()
  const isLoadedTokenDefault = useIsLoadedTokenDefault()
  const currentPath = [APP_PATHS.SWAP, APP_PATHS.LIMIT].find(path => pathname.startsWith(path)) || APP_PATHS.SWAP

  const redirect = useCallback(
    (url: string) => {
      const { inputCurrency, outputCurrency, ...newQs } = qs
      navigate(`${currentPath}${url ? `/${url}` : ''}?${stringify(newQs)}`) // keep query params
    },
    [navigate, qs, currentPath],
  )

  const findTokenBySymbol = useCallback(
    (keyword: string, chainId: ChainId) => {
      const nativeToken = NativeCurrencies[chainId]
      if (keyword === getSymbolSlug(nativeToken)) {
        return nativeToken
      }
      return filterTokensWithExactKeyword(chainId, Object.values(allTokens), keyword)[0]
    },
    [allTokens],
  )

  const syncTokenSymbolToUrl = useCallback(
    (currencyIn: Currency | undefined, currencyOut: Currency | undefined) => {
      const symbolIn = getSymbolSlug(currencyIn)
      const symbolOut = getSymbolSlug(currencyOut)
      if (symbolIn && symbolOut && chainId) {
        redirect(`${NETWORKS_INFO[chainId].route}/${getTokenPath(symbolIn, symbolOut)}`)
      }
    },
    [redirect, chainId],
  )

  const findTokenPairFromUrl = useCallback(
    (chainId: ChainId) => {
      if (!fromCurrency || !network) return
      // net/symbol
      const isSame = fromCurrency && fromCurrency === toCurrency
      if (!toCurrency || isSame) {
        const fromToken = findTokenBySymbol(fromCurrency, chainId)
        if (fromToken) {
          onCurrencySelection(fromToken)
          if (isSame) redirect(`${network}/${fromCurrency}`)
        } else {
          redirect('')
        }
        return
      }

      // net/sym-to-sym
      const fromToken = findTokenBySymbol(convertSymbol(network, fromCurrency), chainId)
      const toToken = findTokenBySymbol(convertSymbol(network, toCurrency), chainId)

      if (!toToken || !fromToken) {
        redirect('')
        return
      }
      onCurrencySelection(fromToken, toToken)
    },
    [findTokenBySymbol, redirect, onCurrencySelection, fromCurrency, network, toCurrency],
  )

  const checkedTokenFromUrl = useRef(false)
  useEffect(() => {
    if (
      !checkedTokenFromUrl.current &&
      isLoadedTokenDefault &&
      Object.values(allTokens)[0]?.chainId === chainId &&
      network === NETWORKS_INFO[chainId].route &&
      !disabled
    ) {
      // call once
      setTimeout(() => findTokenPairFromUrl(chainId))
      checkedTokenFromUrl.current = true
    }
  }, [allTokens, findTokenPairFromUrl, chainId, isLoadedTokenDefault, disabled, network])

  // when token change, sync symbol to url
  useEffect(() => {
    if (isSelectCurrencyManual && isLoadedTokenDefault && !disabled) {
      syncTokenSymbolToUrl(currencyIn, currencyOut)
    }
  }, [currencyIn, currencyOut, isSelectCurrencyManual, syncTokenSymbolToUrl, isLoadedTokenDefault, disabled])
}
