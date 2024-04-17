import { ChainId } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import TokenDetails from 'components/Tokens/TokenDetails'
import { useCreateTDPChartState } from 'components/Tokens/TokenDetails/ChartSection'
import InvalidTokenDetails from 'components/Tokens/TokenDetails/InvalidTokenDetails'
import { TokenDetailsPageSkeleton } from 'components/Tokens/TokenDetails/Skeleton'
import { useTokenWarning } from 'constants/tokenSafety'
import { NATIVE_CHAIN_ID, UNKNOWN_TOKEN_SYMBOL, nativeOnChain } from 'constants/tokens'
import { useTokenBalancesQuery } from 'graphql/data/apollo/TokenBalancesProvider'
import { gqlToCurrency, supportedChainIdFromGQLChain, validateUrlChainParam } from 'graphql/data/util'
import { useCurrency } from 'hooks/Tokens'
import { useSrcColor } from 'hooks/useColor'
import { useMemo } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { useLocation, useParams } from 'react-router-dom'
import { useTheme } from 'styled-components'
import { ThemeProvider } from 'theme'
import { useTokenWebQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { isAddress } from 'utilities/src/addresses'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'
import { LoadedTDPContext, MultiChainMap, PendingTDPContext, TDPProvider } from './TDPContext'
import { getTokenPageTitle } from './utils'

function useOnChainToken(address: string | undefined, chainId: ChainId, skip: boolean) {
  const token = useCurrency(!skip ? address : undefined, chainId)

  if (skip || !address || (token && token?.symbol === UNKNOWN_TOKEN_SYMBOL)) {
    return undefined
  } else {
    return token
  }
}

/** Resolves a currency object from the following sources in order of preference: statically stored natives, query data, backup on-chain fetch data */
function useTDPCurrency(
  tokenQuery: ReturnType<typeof useTokenWebQuery>,
  tokenAddress: string,
  currencyChainId: ChainId,
  isNative: boolean
) {
  const { chainId } = useWeb3React()
  const appChainId = chainId ?? ChainId.MAINNET

  const queryCurrency = useMemo(() => {
    if (isNative) return nativeOnChain(currencyChainId)
    if (tokenQuery.data?.token) return gqlToCurrency(tokenQuery.data.token)
    return undefined
  }, [isNative, currencyChainId, tokenQuery.data?.token])
  // fetches on-chain token if query data is missing and page chain matches global chain (else fetch won't work)
  const skipOnChainFetch = Boolean(queryCurrency) || currencyChainId !== appChainId
  const onChainToken = useOnChainToken(tokenAddress, currencyChainId, skipOnChainFetch)
  const currency = queryCurrency ?? onChainToken
  const currencyWasFetchedOnChain = !queryCurrency

  return { currency, currencyWasFetchedOnChain }
}

/** Returns a map to store addresses and balances of the TDP token on other chains */
function useMultiChainMap(tokenQuery: ReturnType<typeof useTokenWebQuery>) {
  // Build map to store addresses and balances of this token on other chains
  const { data: balanceQuery } = useTokenBalancesQuery()
  return useMemo(() => {
    const tokenBalances = balanceQuery?.portfolios?.[0]?.tokenBalances
    const tokensAcrossChains = tokenQuery.data?.token?.project?.tokens
    if (!tokensAcrossChains) return {}
    return tokensAcrossChains.reduce<MultiChainMap>((map, current) => {
      if (current) {
        if (!map[current.chain]) map[current.chain] = {}
        const update = map[current.chain] ?? {}
        update.address = current.address
        update.balance = tokenBalances?.find((tokenBalance) => tokenBalance?.token?.id === current.id)
        map[current.chain] = update
      }
      return map
    }, {})
  }, [balanceQuery?.portfolios, tokenQuery.data?.token?.project?.tokens])
}

function useCreateTDPContext(): PendingTDPContext | LoadedTDPContext {
  const { tokenAddress, chainName } = useParams<{ tokenAddress: string; chainName?: string }>()
  if (!tokenAddress) throw new Error('Invalid token details route: token address URL param is undefined')
  const currencyChain = validateUrlChainParam(chainName)
  const currencyChainId = supportedChainIdFromGQLChain(currencyChain)

  const isNative = tokenAddress === NATIVE_CHAIN_ID

  const tokenDBAddress = isNative ? getNativeTokenDBAddress(currencyChain) : tokenAddress

  const tokenQuery = useTokenWebQuery({
    variables: { address: tokenDBAddress, chain: currencyChain },
    errorPolicy: 'all',
  })
  const chartState = useCreateTDPChartState(tokenDBAddress, currencyChain)

  const multiChainMap = useMultiChainMap(tokenQuery)

  const { currency, currencyWasFetchedOnChain } = useTDPCurrency(tokenQuery, tokenAddress, currencyChainId, isNative)

  const warning = useTokenWarning(tokenAddress, currencyChainId)

  // Extract color for page usage
  const theme = useTheme()
  const { preloadedLogoSrc } = (useLocation().state as { preloadedLogoSrc?: string }) ?? {}
  const extractedColorSrc = tokenQuery.data?.token?.project?.logoUrl ?? preloadedLogoSrc
  const tokenColor =
    useSrcColor(extractedColorSrc, tokenQuery.data?.token?.name, theme.surface2).tokenColor ?? undefined

  return useMemo(() => {
    return {
      currency,
      currencyChain,
      currencyChainId,
      // `currency.address` is checksummed, whereas the `tokenAddress` url param may not be
      address: (currency?.isNative ? NATIVE_CHAIN_ID : currency?.address) ?? tokenAddress,
      currencyWasFetchedOnChain,
      tokenQuery,
      chartState,
      warning,
      multiChainMap,
      tokenColor,
    }
  }, [
    currency,
    currencyChain,
    currencyChainId,
    currencyWasFetchedOnChain,
    tokenColor,
    multiChainMap,
    warning,
    tokenAddress,
    tokenQuery,
    chartState,
  ])
}

export default function TokenDetailsPage() {
  const pageChainId = useWeb3React().chainId ?? ChainId.MAINNET
  const contextValue = useCreateTDPContext()

  return (
    <ThemeProvider accent1={contextValue.tokenColor ?? undefined}>
      <Helmet>
        <title>{getTokenPageTitle(contextValue?.currency)}</title>
      </Helmet>
      {(() => {
        if (contextValue.currency) {
          return (
            <TDPProvider contextValue={contextValue}>
              <TokenDetails />
            </TDPProvider>
          )
        }

        if (contextValue.tokenQuery.loading) {
          return <TokenDetailsPageSkeleton />
        } else {
          return <InvalidTokenDetails pageChainId={pageChainId} isInvalidAddress={!isAddress(contextValue.address)} />
        }
      })()}
    </ThemeProvider>
  )
}
