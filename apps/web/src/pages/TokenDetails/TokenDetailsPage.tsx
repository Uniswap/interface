import { useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { NumberType } from 'utilities/src/format/types'
import { useScrollCompact } from '~/hooks/useScrollCompact'
import { useDynamicMetatags } from '~/pages/metatags'
import { TokenDetailsPageSkeleton } from '~/pages/TokenDetails/components/skeleton/Skeleton'
import { TokenDetailsContent } from '~/pages/TokenDetails/components/TokenDetails'
import { TDPStoreContextProvider } from '~/pages/TokenDetails/context/TDPStoreContextProvider'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { getTokenPageDescription, getTokenPageTitle, getTokenStructuredData } from '~/pages/TokenDetails/pageMetadata'
import { formatTokenMetatagTitleName } from '~/shared-cloud/metatags'
import { ExploreTab } from '~/types/explore'
import { getNativeTokenDBAddress } from '~/utils/nativeTokens'

export function TokenDetailsPage() {
  return (
    <TDPStoreContextProvider>
      <TDPPageContent />
    </TDPStoreContextProvider>
  )
}

/** Reads from TDP store and handles Helmet, redirect, skeleton vs content. Must be inside TDPStoreContextProvider. */
function TDPPageContent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const isCompact = useScrollCompact({ thresholdCompact: 100, thresholdExpanded: 60 })

  const { address, currency, currencyChain, currencyChainId, tokenQuery, tokenProjectQuery } = useTDPStore((s) => ({
    address: s.address,
    currency: s.currency,
    currencyChain: s.currencyChain,
    currencyChainId: s.currencyChainId,
    tokenQuery: s.tokenQuery,
    tokenProjectQuery: s.tokenProjectQuery,
  }))

  const tokenQueryData = tokenQuery.data?.token

  const price = tokenQueryData?.market?.price?.value
  const priceText = price ? convertFiatAmountFormatted(price, NumberType.FiatTokenPrice) : undefined

  const pageDescription = getTokenPageDescription({ currency, chainId: currencyChainId, price: priceText })

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
      description: pageDescription,
    }
  }, [address, currency, currencyChain, pageDescription, tokenQueryData?.name, tokenQueryData?.symbol])
  const metatags = useDynamicMetatags(metatagProperties)

  // Structured TDP data for SEO indexing
  const structuredData = getTokenStructuredData({ tokenQueryData, price, pageDescription })

  // redirect to /explore if token is not found
  useEffect(() => {
    if (!tokenProjectQuery.loading && !currency) {
      navigate(`/explore?type=${ExploreTab.Tokens}&result=${ModalName.NotFound}`)
    }
  }, [currency, tokenProjectQuery.loading, navigate])

  return (
    <>
      <Helmet>
        <title>{getTokenPageTitle({ t, currency, chainId: currencyChainId })}</title>
        {metatags.map((tag, index) => (
          <meta key={index} {...tag} />
        ))}
        {structuredData && <script type="application/ld+json">{JSON.stringify(structuredData)}</script>}
      </Helmet>
      {/* Gate on metadata (not the market `tokenQuery`) so the shell + header paint before market data loads. */}
      {tokenProjectQuery.loading || !currency ? (
        <TokenDetailsPageSkeleton isCompact={isCompact} />
      ) : (
        <TokenDetailsContent isCompact={isCompact} />
      )}
    </>
  )
}

export default TokenDetailsPage
