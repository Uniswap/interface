import TokenDetails from 'components/Tokens/TokenDetails'
import { useCreateTDPChartState } from 'components/Tokens/TokenDetails/ChartSection'
import { TokenDetailsPageSkeleton } from 'components/Tokens/TokenDetails/Skeleton'
import { NATIVE_CHAIN_ID, UNKNOWN_TOKEN_SYMBOL } from 'constants/tokens'
import { useTokenBalancesQuery } from 'graphql/data/apollo/AdaptiveTokenBalancesProvider'
import { gqlToCurrency } from 'graphql/data/util'
import { useCurrency } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { useSrcColor } from 'hooks/useColor'
import { ExploreTab } from 'pages/Explore/constants'
import { LoadedTDPContext, MultiChainMap, PendingTDPContext, TDPProvider } from 'pages/TokenDetails/TDPContext'
import { getTokenPageDescription, getTokenPageTitle } from 'pages/TokenDetails/utils'
import { useDynamicMetatags } from 'pages/metatags'
import { useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { formatTokenMetatagTitleName } from 'shared-cloud/metatags'
import { useSporeColors } from 'ui/src'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useTokenWebQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants/trace'
import { useChainIdFromUrlParam } from 'utils/chainParams'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'

function useOnChainToken(address: string | undefined, chainId: UniverseChainId, skip: boolean) {
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
  currencyChainId: UniverseChainId,
  isNative: boolean,
) {
  const { chainId } = useAccount()
  const appChainId = chainId ?? UniverseChainId.Mainnet

  const queryCurrency = useMemo(() => {
    if (isNative) {
      return nativeOnChain(currencyChainId)
    }
    if (tokenQuery.data?.token) {
      return gqlToCurrency(tokenQuery.data.token)
    }
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
    if (!tokensAcrossChains) {
      return {}
    }
    return tokensAcrossChains.reduce<MultiChainMap>((map, current) => {
      if (current) {
        if (!map[current.chain]) {
          map[current.chain] = {}
        }
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
  const { tokenAddress } = useParams<{ tokenAddress: string; chainName: string }>()
  if (!tokenAddress) {
    throw new Error('Invalid token details route: token address URL param is undefined')
  }

  const currencyChainInfo = getChainInfo(useChainIdFromUrlParam() ?? UniverseChainId.Mainnet)

  const isNative = tokenAddress === NATIVE_CHAIN_ID

  const tokenDBAddress = isNative ? getNativeTokenDBAddress(currencyChainInfo.backendChain.chain) : tokenAddress

  const tokenQuery = useTokenWebQuery({
    variables: { address: tokenDBAddress, chain: currencyChainInfo.backendChain.chain },
    errorPolicy: 'all',
  })
  const chartState = useCreateTDPChartState(tokenDBAddress, currencyChainInfo.backendChain.chain)

  const multiChainMap = useMultiChainMap(tokenQuery)

  const { currency, currencyWasFetchedOnChain } = useTDPCurrency(
    tokenQuery,
    tokenAddress,
    currencyChainInfo.id,
    isNative,
  )

  // Extract color for page usage
  const colors = useSporeColors()
  const { preloadedLogoSrc } = (useLocation().state as { preloadedLogoSrc?: string }) ?? {}
  const extractedColorSrc = tokenQuery.data?.token?.project?.logoUrl ?? preloadedLogoSrc
  const tokenColor =
    useSrcColor(
      extractedColorSrc,
      tokenQuery.data?.token?.name ?? tokenQuery.data?.token?.project?.name,
      colors.surface2.val,
    ).tokenColor ?? undefined

  return useMemo(() => {
    return {
      currency,
      currencyChain: currencyChainInfo.backendChain.chain,
      currencyChainId: currencyChainInfo.id,
      // `currency.address` is checksummed, whereas the `tokenAddress` url param may not be
      address: (currency?.isNative ? NATIVE_CHAIN_ID : currency?.address) ?? tokenAddress,
      currencyWasFetchedOnChain,
      tokenQuery,
      chartState,
      multiChainMap,
      tokenColor,
    }
  }, [
    currency,
    currencyChainInfo.backendChain.chain,
    currencyChainInfo.id,
    tokenAddress,
    currencyWasFetchedOnChain,
    tokenQuery,
    chartState,
    multiChainMap,
    tokenColor,
  ])
}

export default function TokenDetailsPage() {
  const { t } = useTranslation()
  const contextValue = useCreateTDPContext()
  const { address, currency, currencyChain, currencyChainId, tokenQuery } = contextValue
  const navigate = useNavigate()

  const tokenQueryData = tokenQuery.data?.token
  const metatagProperties = useMemo(() => {
    return {
      title: formatTokenMetatagTitleName(tokenQueryData?.symbol, tokenQueryData?.name),
      image:
        window.location.origin +
        '/api/image/tokens/' +
        currencyChain.toLowerCase() +
        '/' +
        (currency?.isNative ? getNativeTokenDBAddress(currencyChain) : address),
      url: window.location.href,
      description: getTokenPageDescription(currency, currencyChainId),
    }
  }, [address, currency, currencyChain, currencyChainId, tokenQueryData?.name, tokenQueryData?.symbol])
  const metatags = useDynamicMetatags(metatagProperties)

  // redirect to /explore if token is not found
  useEffect(() => {
    if (!tokenQuery.loading && !currency) {
      navigate(`/explore?type=${ExploreTab.Tokens}&result=${ModalName.NotFound}`)
    }
  }, [currency, tokenQuery.loading, navigate])

  return (
    <>
      <Helmet>
        <title>{getTokenPageTitle(t, currency, currencyChainId)}</title>
        {metatags.map((tag, index) => (
          <meta key={index} {...tag} />
        ))}
      </Helmet>
      {(() => {
        if (tokenQuery.loading || !currency) {
          return <TokenDetailsPageSkeleton />
        }

        return (
          <TDPProvider contextValue={contextValue}>
            <TokenDetails />
          </TDPProvider>
        )
      })()}
    </>
  )
}
