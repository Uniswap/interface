import { useStatsigClientStatus } from '@universe/gating'
import { useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useFeatureFlaggedChainIds } from 'uniswap/src/features/chains/hooks/useFeatureFlaggedChainIds'
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

  const { address, currency, currencyChain, currencyChainId, token, pageQueryLoading } = useTDPStore((s) => ({
    address: s.address,
    currency: s.currency,
    currencyChain: s.currencyChain,
    currencyChainId: s.currencyChainId,
    token: s.token,
    pageQueryLoading: s.pageQueryLoading,
  }))

  const featureFlaggedChainIds = useFeatureFlaggedChainIds()
  const { isStatsigReady } = useStatsigClientStatus()

  const price = token?.price?.spotUsd
  const priceText = price ? convertFiatAmountFormatted(price, NumberType.FiatTokenPrice) : undefined

  const pageDescription = getTokenPageDescription({ currency, chainId: currencyChainId, price: priceText })

  const metatagProperties = useMemo(() => {
    return {
      title: formatTokenMetatagTitleName(token?.symbol, token?.name),
      image:
        window.location.origin +
        '/api/image/tokens/' +
        currencyChain.toLowerCase() +
        '/' +
        (currency?.isNative ? getNativeTokenDBAddress(currencyChain) : address),
      url: window.location.href,
      description: pageDescription,
    }
  }, [address, currency, currencyChain, pageDescription, token?.name, token?.symbol])
  const metatags = useDynamicMetatags(metatagProperties)

  // Structured TDP data for SEO indexing
  const structuredData = getTokenStructuredData({ token, price, pageDescription })

  // redirect to /explore if the token is not found, or if its chain is feature-gated (e.g. unlaunched Arc/Robinhood).
  // Gate the chain check on `isStatsigReady`: before Statsig loads, feature flags read as their default (false), so a
  // launched-but-flag-gated chain (e.g. Linea) would otherwise be transiently treated as gated and wrongly redirected.
  useEffect(() => {
    const isChainGated = isStatsigReady && !featureFlaggedChainIds.includes(currencyChainId)
    if (isChainGated || (!pageQueryLoading && !currency)) {
      navigate(`/explore?type=${ExploreTab.Tokens}&result=${ModalName.NotFound}`)
    }
  }, [currency, currencyChainId, featureFlaggedChainIds, isStatsigReady, pageQueryLoading, navigate])

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
      {pageQueryLoading || !currency ? (
        <TokenDetailsPageSkeleton isCompact={isCompact} />
      ) : (
        <TokenDetailsContent isCompact={isCompact} />
      )}
    </>
  )
}

export default TokenDetailsPage
