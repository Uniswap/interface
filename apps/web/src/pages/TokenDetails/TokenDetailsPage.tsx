import { useEffect, useMemo } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { NumberType } from 'utilities/src/format/types'
import { useScroll } from '~/hooks/useScroll'
import { useScrollCompact } from '~/hooks/useScrollCompact'
import { ExploreTab } from '~/pages/Explore/constants'
import { useDynamicMetatags } from '~/pages/metatags'
import { TokenDetailsPageSkeleton } from '~/pages/TokenDetails/components/skeleton/Skeleton'
import { TokenDetailsContent } from '~/pages/TokenDetails/components/TokenDetails'
import { TDPProvider } from '~/pages/TokenDetails/context/TDPContext'
import { useCreateTDPContext } from '~/pages/TokenDetails/context/useCreateTDPContext'
import { getTokenPageDescription, getTokenPageTitle, getTokenStructuredData } from '~/pages/TokenDetails/pageMetadata'
import { formatTokenMetatagTitleName } from '~/shared-cloud/metatags'
import { getNativeTokenDBAddress } from '~/utils/nativeTokens'

export default function TokenDetailsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { height: scrollY } = useScroll()
  const isCompact = useScrollCompact({ scrollY, thresholdCompact: 100, thresholdExpanded: 60 })

  const contextValue = useCreateTDPContext()
  const { address, currency, currencyChain, currencyChainId, tokenQuery } = contextValue

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
        {structuredData && <script type="application/ld+json">{JSON.stringify(structuredData)}</script>}
      </Helmet>
      {(() => {
        if (tokenQuery.loading || !currency) {
          return <TokenDetailsPageSkeleton isCompact={isCompact} />
        }

        return (
          <TDPProvider contextValue={contextValue}>
            <TokenDetailsContent isCompact={isCompact} />
          </TDPProvider>
        )
      })()}
    </>
  )
}
