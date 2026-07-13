// oxlint-disable-next-line no-restricted-imports -- Used outside React component context where useTranslation is not available
import { TFunction, t } from 'i18next'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, Tooltip, TouchableArea, useMedia } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { Globe } from 'ui/src/components/icons/Globe'
import { XTwitter } from 'ui/src/components/icons/XTwitter'
import { CopyHelper } from 'uniswap/src/components/CopyHelper/CopyHelper'
import { shortenAddress } from 'utilities/src/addresses'
import { useAuctionStatsData } from '~/features/Toucan/Auction/hooks/useAuctionStatsData'
import { formatTimestampToDate } from '~/features/Toucan/Auction/utils/formatting'
import { deprecatedStyled } from '~/lib/deprecated-styled'
import { ExternalLink } from '~/theme/components/Links'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

interface StatItem {
  label: string
  value: string | ReactNode | undefined
}

interface BuildStatItemsParams {
  t: TFunction
  impliedTokenPrice: { start: string; end?: string } | null // e.g., { start: "0.041589 ETH", end: "0.042626 ETH" }
  totalBidCount: number | null
  totalCurrencyRaisedFormatted: string | null
  requiredCurrencyFormatted: string | null // e.g., "10k ETH"
  percentCommittedToLpFormatted: string | null
  auctionSupply: string | null // Amount being auctioned (auctionDetails.totalSupply)
  auctionTokenSymbol: string | undefined // Token symbol (e.g., "TCAN")
  totalSupply: string | null // Total token supply (auctionDetails.tokenTotalSupply)
  isAuctionEnded: boolean
}

// Placeholder for stats we don't have data for yet
const STATS_PLACEHOLDER = '--'

/**
 * Formats the implied token price for display.
 * Renders range prices on two lines for better readability.
 */
export function formatImpliedTokenPrice({
  impliedTokenPrice,
  variant = 'subheading1',
  stacked = false,
}: {
  impliedTokenPrice: { start: string; end?: string } | null
  variant?: 'subheading1' | 'subheading2' | 'body3'
  stacked?: boolean
}): ReactNode {
  if (!impliedTokenPrice) {
    return STATS_PLACEHOLDER
  }

  // Single price (auction ended) - render on one line
  if (!impliedTokenPrice.end) {
    return impliedTokenPrice.start
  }

  // Price range
  return (
    <Flex>
      <Tooltip placement="top">
        <Tooltip.Trigger>
          <Flex row={!stacked} alignItems={stacked ? 'flex-start' : 'center'} gap={stacked ? '$none' : '$spacing4'}>
            <Text variant={variant} color="$neutral1">
              {impliedTokenPrice.start}
            </Text>
            <Text variant={variant} color="$neutral2">
              –
            </Text>
            <Text variant={variant} color="$neutral1">
              {impliedTokenPrice.end}
            </Text>
          </Flex>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <Text variant="body4" color="$neutral1" maxWidth={250}>
            {t('toucan.auction.stats.impliedTokenPrice.tooltip')}
          </Text>
        </Tooltip.Content>
      </Tooltip>
    </Flex>
  )
}

function buildStatItems({
  // oxlint-disable-next-line no-shadow
  t,
  impliedTokenPrice,
  totalBidCount,
  percentCommittedToLpFormatted,
  auctionTokenSymbol,
  totalSupply,
  isAuctionEnded,
  valueVariant,
}: Pick<
  BuildStatItemsParams,
  | 't'
  | 'impliedTokenPrice'
  | 'totalBidCount'
  | 'percentCommittedToLpFormatted'
  | 'auctionTokenSymbol'
  | 'totalSupply'
  | 'isAuctionEnded'
> & { valueVariant: 'subheading1' | 'subheading2' }): StatItem[] {
  return [
    {
      label: isAuctionEnded ? t('toucan.statsBanner.finalClearingPrice') : t('toucan.auction.stats.impliedTokenPrice'),
      value: formatImpliedTokenPrice({ impliedTokenPrice, variant: valueVariant, stacked: true }),
    },
    {
      label: t('toucan.auction.stats.totalBids'),
      value: totalBidCount?.toLocaleString() ?? STATS_PLACEHOLDER,
    },
    {
      label: t('toucan.auction.stats.percentLP'),
      value: percentCommittedToLpFormatted ?? '-',
    },
    {
      label: t('toucan.auction.totalSupply'),
      value: totalSupply ? `${totalSupply} ${auctionTokenSymbol ?? ''}`.trim() : STATS_PLACEHOLDER,
    },
  ]
}

const STATS_PER_ROW_DESKTOP = 4

const StatsGrid = styled(Flex, {
  width: '100%',
  '$platform-web': {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
  },
  $lg: {
    backgroundColor: '$surface3',
    '$platform-web': {
      gridTemplateColumns: '1fr 1fr',
      gap: 1,
    },
  },
})

const StatCell = styled(Flex, {
  paddingVertical: '$spacing12',
  gap: '$spacing2',
  paddingRight: '$spacing6',
  borderRightWidth: 1,
  borderColor: '$surface3',
  $md: {
    paddingVertical: '$spacing8',
  },
  $lg: {
    borderRightWidth: 0,
    paddingRight: 0,
    paddingHorizontal: '$spacing12',
    backgroundColor: '$surface1',
  },
  variants: {
    isLastInRow: {
      true: {
        borderRightWidth: 0,
      },
    },
    isFirstRow: {
      true: {
        borderBottomWidth: 1,
        borderColor: '$surface3',
      },
    },
    hasLeftPadding: {
      true: {
        paddingLeft: '$spacing12',
      },
    },
  } as const,
})

const InfoRow = styled(Flex, {
  width: '100%',
  flexDirection: 'row',
  gap: '$spacing16',
})

const InfoCell = styled(Flex, {
  gap: '$spacing2',
  paddingVertical: '$spacing2',
  $md: {
    paddingVertical: '$spacing2',
  },
  variants: {
    withBorder: {
      true: {
        borderLeftWidth: 1,
        borderColor: '$surface3',
        paddingHorizontal: '$spacing16',
      },
    },
  } as const,
})

const SocialBadge = styled(Text, {
  variant: 'buttonLabel3',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$spacing8',
  paddingHorizontal: '$spacing12',
  height: 32,
  borderRadius: '$rounded20',
  backgroundColor: '$surface3',
  ...ClickableTamaguiStyle,
  color: '$neutral1',
})

const CompanyIcon = styled(Flex, {
  width: 16,
  height: 16,
  borderRadius: '$roundedFull',
  backgroundColor: '$accent1',
  alignItems: 'center',
  justifyContent: 'center',
})

// Override ExternalLink's pink stroke to prevent it from affecting child SVG icons
const StyledExternalLink = deprecatedStyled(ExternalLink)`
  stroke: none;
`

export const AuctionStatsGrid = ({ onViewAllStats }: { onViewAllStats?: () => void }) => {
  // oxlint-disable-next-line no-shadow
  const { t } = useTranslation()
  const media = useMedia()

  const {
    auctionTokenSymbol,
    isAuctionEnded,
    totalSupply,
    totalBidCount,
    percentCommittedToLpFormatted,
    impliedTokenPrice,
  } = useAuctionStatsData()

  const valueVariant = media.lg ? 'subheading2' : 'subheading1'

  const statItems = buildStatItems({
    t,
    impliedTokenPrice,
    totalBidCount,
    percentCommittedToLpFormatted,
    auctionTokenSymbol,
    totalSupply,
    isAuctionEnded,
    valueVariant,
  })

  return (
    <Flex width="100%" flexShrink={0} gap="$spacing16">
      <Flex row justifyContent="space-between" alignItems="center">
        <Text variant={media.lg ? 'subheading1' : 'heading3'}>{t('toucan.auction.stats')}</Text>
        {onViewAllStats && (
          <TouchableArea row alignItems="center" gap="$spacing4" onPress={onViewAllStats}>
            <Text variant="body3" color="$neutral2" hoverStyle={{ color: '$neutral1' }}>
              {t('toucan.auction.viewAllStats')}
            </Text>
            <ArrowRight color="$neutral2" size="$icon.12" />
          </TouchableArea>
        )}
      </Flex>
      <StatsGrid>
        {statItems.map((item, index) => {
          const col = index % STATS_PER_ROW_DESKTOP
          const isInFirstRow = index < STATS_PER_ROW_DESKTOP

          return (
            <StatCell
              key={`${item.label}-${index}`}
              isLastInRow={col === STATS_PER_ROW_DESKTOP - 1}
              isFirstRow={isInFirstRow && statItems.length > STATS_PER_ROW_DESKTOP}
              hasLeftPadding={col !== 0}
            >
              <Text variant="body3" color="$neutral2">
                {item.label}
              </Text>
              {typeof item.value === 'string' ? (
                <Text variant={valueVariant} color="$neutral1">
                  {item.value}
                </Text>
              ) : (
                item.value
              )}
            </StatCell>
          )
        })}
      </StatsGrid>
    </Flex>
  )
}

export const AuctionInfo = () => {
  // oxlint-disable-next-line no-shadow
  const { t } = useTranslation()
  const media = useMedia()
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const descriptionRef = useRef<HTMLDivElement | null>(null)
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false)

  const { tokenAddress, launchedOnTimestamp, isAuctionInFuture, metadata } = useAuctionStatsData()

  // Only surface the "Show more" toggle when the clamped description actually
  // overflows its 2-line box. Measured while collapsed (expanded text is
  // unclamped and would always report as non-overflowing) and re-checked on
  // resize, since width changes affect wrapping.
  useEffect(() => {
    const element = descriptionRef.current
    if (!element) {
      return undefined
    }
    const measureTruncation = (): void => {
      if (isDescriptionExpanded) {
        return
      }
      setIsDescriptionTruncated(element.scrollHeight > element.clientHeight + 1)
    }
    measureTruncation()
    const resizeObserver = new ResizeObserver(measureTruncation)
    resizeObserver.observe(element)
    return () => resizeObserver.disconnect()
  }, [metadata?.description, isDescriptionExpanded])

  const launchedOnLabel = isAuctionInFuture ? t('toucan.auction.launchesOn') : t('toucan.auction.launchedOn')
  const launchedOnValue = launchedOnTimestamp ? formatTimestampToDate(launchedOnTimestamp) : '--'
  const contractAddress = tokenAddress ?? '--'

  return (
    <Flex maxWidth="100%" flexShrink={0} gap="$spacing16" $xl={{ width: 360 }} $lg={{ width: '100%' }}>
      <Flex gap="$spacing16">
        <Text variant={media.lg ? 'subheading1' : 'heading3'}>{t('toucan.auction.info')}</Text>

        <InfoRow>
          {metadata?.launchedByName && (
            <InfoCell>
              <Text variant="body3" color="$neutral2">
                {t('toucan.auction.launchedBy')}
              </Text>
              <Flex row gap="$spacing8" alignItems="center" flexShrink={1} minWidth={0}>
                <CompanyIcon flexShrink={0}>
                  <Text variant="body3" fontSize={10} color="$surface1">
                    {metadata.launchedByName.charAt(0).toUpperCase()}
                  </Text>
                </CompanyIcon>
                <Text
                  variant="subheading1"
                  color="$neutral1"
                  numberOfLines={1}
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {metadata.launchedByName}
                </Text>
              </Flex>
            </InfoCell>
          )}

          <InfoCell withBorder={!!metadata?.launchedByName}>
            <Text variant="body3" color="$neutral2">
              {launchedOnLabel}
            </Text>
            <Text variant="subheading1" color="$neutral1">
              {launchedOnValue}
            </Text>
          </InfoCell>

          <InfoCell withBorder>
            <Text variant="body3" color="$neutral2">
              {t('toucan.auction.contractAddress')}
            </Text>
            <Flex row gap="$spacing4" alignItems="center" flexWrap="nowrap">
              <CopyHelper
                toCopy={contractAddress}
                iconPosition="right"
                iconSize={16}
                iconColor="$neutral2"
                alwaysShowIcon
              >
                <Text variant="subheading1" color="$neutral1" numberOfLines={1}>
                  {tokenAddress ? shortenAddress({ address: tokenAddress, chars: 4 }) : '--'}
                </Text>
              </CopyHelper>
            </Flex>
          </InfoCell>
        </InfoRow>

        {metadata?.description && (
          <Flex gap="$spacing8">
            <Text variant="body3" color="$neutral2">
              {t('toucan.auction.description')}
            </Text>
            <Text
              ref={descriptionRef}
              variant="body2"
              color="$neutral1"
              numberOfLines={isDescriptionExpanded ? undefined : 2}
              ellipsizeMode="tail"
            >
              {metadata.description}
            </Text>
            {isDescriptionTruncated && (
              <Text
                variant="buttonLabel3"
                color="$neutral2"
                onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                cursor="pointer"
                hoverStyle={{ color: '$neutral1' }}
              >
                {isDescriptionExpanded ? t('toucan.auction.showLess') : t('toucan.auction.showMore')}
              </Text>
            )}
          </Flex>
        )}

        {(metadata?.website || metadata?.twitter) && (
          <Flex row gap="$spacing8">
            {metadata.website && (
              <StyledExternalLink href={metadata.website}>
                <SocialBadge>
                  <Globe size={16} color="$neutral2" />
                  {t('toucan.auction.website')}
                </SocialBadge>
              </StyledExternalLink>
            )}
            {metadata.twitter && (
              <StyledExternalLink href={metadata.twitter}>
                <SocialBadge>
                  <XTwitter size={16} color="$neutral2" />
                  {t('toucan.auction.twitter')}
                </SocialBadge>
              </StyledExternalLink>
            )}
          </Flex>
        )}
      </Flex>

      <Text color="$neutral3" variant="body4">
        {t('toucan.auction.disclaimer.recommendations')}
      </Text>
    </Flex>
  )
}
