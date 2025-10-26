import { gqlToCurrency } from 'appGraphql/data/util'
import { GraphQLApi } from '@universe/api'
import TokenDetails from 'components/Tokens/TokenDetails'
import { useCreateTDPChartState } from 'components/Tokens/TokenDetails/ChartSection'
import { TokenDetailsPageSkeleton } from 'components/Tokens/TokenDetails/Skeleton'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useActiveAddresses } from 'features/accounts/store/hooks'
import { useSrcColor } from 'hooks/useColor'
import { ExploreTab } from 'pages/Explore/constants'
import { useDynamicMetatags } from 'pages/metatags'
import { LoadedTDPContext, MultiChainMap, PendingTDPContext, TDPProvider } from 'pages/TokenDetails/TDPContext'
import { getTokenPageDescription, getTokenPageTitle } from 'pages/TokenDetails/utils'
import { useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'
import { formatTokenMetatagTitleName } from 'shared-cloud/metatags'
import { useSporeColors } from 'ui/src'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { usePortfolioBalances } from 'uniswap/src/features/dataApi/balances/balances'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { buildCurrencyId, buildNativeCurrencyId, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { useChainIdFromUrlParam } from 'utils/chainParams'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'

/** Returns a map to store addresses and balances of the TDP token on other chains */
function useMultiChainMap(tokenQuery: ReturnType<typeof GraphQLApi.useTokenWebQuery>) {
  const activeAddresses = useActiveAddresses()
  const evmAddress = activeAddresses.evmAddress
  const svmAddress = activeAddresses.svmAddress

  const { data: balancesById } = usePortfolioBalances({
    evmAddress,
    svmAddress,
    skip: !evmAddress && !svmAddress,
  })

  return useMemo(() => {
    const tokensAcrossChains = tokenQuery.data?.token?.project?.tokens
    if (!tokensAcrossChains) {
      return {}
    }

    return tokensAcrossChains.reduce<MultiChainMap>((map, current) => {
      if (!map[current.chain]) {
        map[current.chain] = {}
      }
      const update = map[current.chain] ?? {}
      update.address = current.address

      // Find the balance for this token using the balancesById map
      if (balancesById) {
        // Convert GraphQL chain to UniverseChainId and construct currency ID
        const chainId = fromGraphQLChain(current.chain)
        if (chainId) {
          // For native tokens (no address or NATIVE_CHAIN_ID), use the native address
          // For non-native tokens, use the token address
          const currencyId =
            !current.address || isNativeCurrencyAddress(chainId, current.address)
              ? buildNativeCurrencyId(chainId)
              : buildCurrencyId(chainId, current.address)
          update.balance = balancesById[currencyId]
        }
      }

      map[current.chain] = update
      return map
    }, {})
  }, [balancesById, tokenQuery.data?.token?.project?.tokens])
}

function useCreateTDPContext(): PendingTDPContext | LoadedTDPContext {
  const { tokenAddress } = useParams<{ tokenAddress: string; chainName: string }>()
  if (!tokenAddress) {
    throw new Error('Invalid token details route: token address URL param is undefined')
  }

  const currencyChainInfo = getChainInfo(useChainIdFromUrlParam() ?? UniverseChainId.Mainnet)

  const isNative = tokenAddress === NATIVE_CHAIN_ID

  const tokenDBAddress = isNative ? getNativeTokenDBAddress(currencyChainInfo.backendChain.chain) : tokenAddress

  const tokenQuery = GraphQLApi.useTokenWebQuery({
    variables: { address: tokenDBAddress, chain: currencyChainInfo.backendChain.chain },
    errorPolicy: 'all',
  })
  const currency = useMemo(() => {
    if (isNative) {
      return nativeOnChain(currencyChainInfo.id)
    }
    if (tokenQuery.data?.token) {
      return gqlToCurrency(tokenQuery.data.token)
    }
    return undefined
  }, [tokenQuery.data?.token, isNative, currencyChainInfo.id])

  const chartState = useCreateTDPChartState(tokenDBAddress, currencyChainInfo.backendChain.chain)

  const multiChainMap = useMultiChainMap(tokenQuery)

  // Extract color for page usage
  const colors = useSporeColors()
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const { preloadedLogoSrc } = (useLocation().state as { preloadedLogoSrc?: string }) ?? {}
  const extractedColorSrc = tokenQuery.data?.token?.project?.logoUrl ?? preloadedLogoSrc
  const tokenColor =
    useSrcColor({
      src: extractedColorSrc,
      currencyName: currency?.name,
      backgroundColor: colors.surface2.val,
    }).tokenColor ?? undefined

  return useMemo(() => {
    return {
      currency,
      currencyChain: currencyChainInfo.backendChain.chain,
      currencyChainId: currencyChainInfo.id,
      // `currency.address` is checksummed, whereas the `tokenAddress` url param may not be
      address: (currency?.isNative ? NATIVE_CHAIN_ID : currency?.address) ?? tokenAddress,
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
        <title>{getTokenPageTitle({ t, currency, chainId: currencyChainId })}</title>
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
