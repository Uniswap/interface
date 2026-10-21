import type { UniverseChainId } from '@universe/chains'
import { iconSizes, Text } from '@universe/mycelium'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import {
  hasHoverCardChartData,
  HoverCardBody,
  HoverCardChart,
  HoverCardHeadline,
  HoverCardIdentity,
  HoverCardStatsRow,
  isHoverCardNoData,
} from '~/components/HoverCard/HoverCardContent'

export interface AuctionHoverCardContentProps {
  chainId: UniverseChainId
  tokenAddress: string
  tokenSymbol: string
  tokenName?: string
  tokenLogoUrl?: string
  fdvUsd?: number
  pricePercentChange?: number
  priceData: PriceChartData[]
  committedVolumeUsd?: number
  bidderCount?: number
  bidCount?: number
  loading: boolean
  isCopied: boolean
  onCopy?: () => void
  onExpand: () => void
  maxWidth?: number
}

function AuctionHoverCardContentInner({
  chainId,
  tokenAddress,
  tokenSymbol,
  tokenName,
  tokenLogoUrl,
  fdvUsd,
  pricePercentChange,
  priceData,
  committedVolumeUsd,
  bidderCount,
  bidCount,
  loading,
  isCopied,
  onCopy,
  onExpand,
  maxWidth,
}: AuctionHoverCardContentProps): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const formattedFdv = fdvUsd !== undefined ? convertFiatAmountFormatted(fdvUsd, NumberType.FiatTokenStats) : ''
  const committed =
    committedVolumeUsd !== undefined
      ? t('toucan.auction.hoverCard.committed', {
          amount: convertFiatAmountFormatted(committedVolumeUsd, NumberType.FiatTokenStats),
        })
      : undefined
  const participation =
    bidderCount !== undefined
      ? t('toucan.auction.hoverCard.bidders', { count: bidderCount })
      : bidCount !== undefined
        ? t('toucan.auction.hoverCard.bids', { count: bidCount })
        : undefined
  // Committed volume and bidders come from the search row, so they can stand alone when GetAuction and the
  // 1D series both come back empty (common for a pre-launch token).
  const hasStats = committedVolumeUsd !== undefined || bidderCount !== undefined || bidCount !== undefined
  const isNoData =
    !hasStats && isHoverCardNoData({ loading, headline: fdvUsd, change: pricePercentChange, data: priceData })
  const hasHeadline = loading || fdvUsd !== undefined
  // With no headline and no series the stats stand alone, so the "chart unavailable" block is dropped rather
  // than left sitting above them.
  const showChart = hasHeadline || hasHoverCardChartData(priceData)

  return (
    <HoverCardBody
      identity={
        <HoverCardIdentity
          logo={
            <TokenLogo
              url={tokenLogoUrl}
              size={iconSizes.icon32}
              chainId={chainId}
              symbol={tokenSymbol}
              name={tokenName}
            />
          }
          title={tokenSymbol}
          subtitle={shortenAddress({ address: tokenAddress })}
        />
      }
      isCopied={isCopied}
      onCopy={onCopy}
      onExpand={onExpand}
      isNoData={isNoData}
      maxWidth={maxWidth}
    >
      {hasHeadline && (
        <HoverCardHeadline
          loading={loading}
          loadingPlaceholderText="$0.00M"
          value={formattedFdv}
          caption={
            <Text variant="body3" color="$neutral2">
              {t('stats.fdv')}
            </Text>
          }
        />
      )}
      {showChart && <HoverCardChart loading={loading} data={priceData} change={pricePercentChange} />}
      <HoverCardStatsRow
        loading={loading}
        loadingPlaceholderText="$000.0K committed · 000 bidders"
        stats={[committed, participation]}
      />
    </HoverCardBody>
  )
}

export const AuctionHoverCardContent = memo(AuctionHoverCardContentInner)
