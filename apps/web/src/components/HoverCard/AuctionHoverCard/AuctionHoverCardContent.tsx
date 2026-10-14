import type { UniverseChainId } from '@universe/chains'
import { Flex, iconSizes, Text } from '@universe/mycelium'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import {
  hasHoverCardChartData,
  HoverCardBody,
  HoverCardChart,
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

function FdvRow({
  loading,
  formattedFdv,
  percentChange,
}: {
  loading: boolean
  formattedFdv: string
  percentChange?: number
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex row alignItems="flex-end" gap="$spacing8" pt="$spacing4">
      <Text variant="heading3" color="$neutral1" loading={loading} loadingPlaceholderText="$0.00M">
        {formattedFdv}
      </Text>
      {loading ? (
        <Text variant="body3" color="$neutral2" loading loadingPlaceholderText="+0.00% today" />
      ) : (
        percentChange !== undefined && (
          <Flex row alignItems="center" gap="$spacing4" pb="$spacing2">
            <RelativeChange change={percentChange} semanticColor variant="body3" arrowSize="$icon.16" />
            <Text variant="body3" color="$neutral3">
              {t('common.today').toLocaleLowerCase()}
            </Text>
          </Flex>
        )
      )}
    </Flex>
  )
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
        <>
          <TokenLogo
            url={tokenLogoUrl}
            size={iconSizes.icon32}
            chainId={chainId}
            symbol={tokenSymbol}
            name={tokenName}
          />
          <Flex shrink minWidth={0}>
            <Text variant="body3" color="$neutral1" numberOfLines={1}>
              {tokenSymbol}
            </Text>
            <Text variant="body3" color="$neutral2" numberOfLines={1}>
              {shortenAddress({ address: tokenAddress })}
            </Text>
          </Flex>
        </>
      }
      isCopied={isCopied}
      onCopy={onCopy}
      onExpand={onExpand}
      isNoData={isNoData}
      maxWidth={maxWidth}
    >
      {hasHeadline && <FdvRow loading={loading} formattedFdv={formattedFdv} percentChange={pricePercentChange} />}
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
