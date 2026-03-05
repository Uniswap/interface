import { TFunction, t } from 'i18next'
import { ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, Tooltip, useMedia } from 'ui/src'
import { Globe } from 'ui/src/components/icons/Globe'
import { XTwitter } from 'ui/src/components/icons/XTwitter'
import { zIndexes } from 'ui/src/theme/zIndexes'
import { shortenAddress } from 'utilities/src/addresses'
import { useAuctionStatsData } from '~/components/Toucan/Auction/hooks/useAuctionStatsData'
import { formatTimestampToDate } from '~/components/Toucan/Auction/utils/formatting'
import { deprecatedStyled } from '~/lib/deprecated-styled'
import { CopyHelper } from '~/theme/components/CopyHelper'
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
function formatImpliedTokenPrice(impliedTokenPrice: { start: string; end?: string } | null): ReactNode {
  if (!impliedTokenPrice) {
    return STATS_PLACEHOLDER
  }

  // Single price (auction ended) - render on one line
  if (!impliedTokenPrice.end) {
    return impliedTokenPrice.start
  }

  // Price range - render on two lines
  return (
    <Flex>
      <Tooltip placement="top">
        <Tooltip.Trigger>
          <Text variant="subheading1" color="$neutral1">
            {impliedTokenPrice.start} –
          </Text>
          <Text variant="subheading1" color="$neutral1">
            {impliedTokenPrice.end}
          </Text>
        </Tooltip.Trigger>
        <Tooltip.Content zIndex={zIndexes.overlay}>
          <Text variant="body4" color="$neutral1" maxWidth={250}>
            {t('toucan.auction.stats.impliedTokenPrice.tooltip')}
          </Text>
        </Tooltip.Content>
      </Tooltip>
    </Flex>
  )
}

/**
 * Builds the list of stat items to display
 * Note: We don't filter out undefined values anymore since we want to show placeholders
 * @param params - The auction stats data and translation function
 * @returns Array of stat items with labels and values
 */
/**
 * Formats the total currency raised with optional required amount below.
 */
function formatCurrencyRaised({
  totalCurrencyRaisedFormatted,
  requiredCurrencyFormatted,
  t,
}: {
  totalCurrencyRaisedFormatted: string | null
  requiredCurrencyFormatted: string | null
  t: TFunction
}): ReactNode {
  if (!totalCurrencyRaisedFormatted) {
    return STATS_PLACEHOLDER
  }

  if (!requiredCurrencyFormatted) {
    return totalCurrencyRaisedFormatted
  }

  return (
    <Flex>
      <Text variant="subheading1" color="$neutral1">
        {totalCurrencyRaisedFormatted}
      </Text>
      <Text variant="body4" color="$neutral2">
        {t('toucan.statsBanner.requiredCurrency', { amount: requiredCurrencyFormatted })}
      </Text>
    </Flex>
  )
}

function buildStatItems({
  t,
  impliedTokenPrice,
  totalBidCount,
  totalCurrencyRaisedFormatted,
  requiredCurrencyFormatted,
  percentCommittedToLpFormatted,
  auctionSupply,
  auctionTokenSymbol,
  totalSupply,
  isAuctionEnded,
}: BuildStatItemsParams): StatItem[] {
  return [
    {
      label: isAuctionEnded ? t('toucan.statsBanner.finalClearingPrice') : t('toucan.auction.stats.impliedTokenPrice'),
      value: formatImpliedTokenPrice(impliedTokenPrice),
    },
    {
      label: t('toucan.auction.stats.totalBids'),
      value: totalBidCount?.toLocaleString() ?? STATS_PLACEHOLDER,
    },
    {
      label: t('toucan.statsBanner.totalCurrencyRaised'),
      value: formatCurrencyRaised({
        totalCurrencyRaisedFormatted,
        requiredCurrencyFormatted,
        t,
      }),
    },
    {
      label: t('toucan.auction.stats.percentLP'),
      value: percentCommittedToLpFormatted ?? '-',
    },
    {
      label: t('toucan.auction.stats.auctionSupply'),
      value: auctionSupply ? `${auctionSupply} ${auctionTokenSymbol ?? ''}`.trim() : STATS_PLACEHOLDER,
    },
    {
      label: t('toucan.auction.totalSupply'),
      value: totalSupply ? `${totalSupply} ${auctionTokenSymbol ?? ''}`.trim() : STATS_PLACEHOLDER,
    },
  ]
}

const STATS_PER_ROW = 3

const StatsGrid = styled(Flex, {
  width: '100%',
  '$platform-web': {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
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
  variants: {
    // Position-based variants for grid layout
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
  '$platform-web': {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
  },
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

export const AuctionStats = () => {
  const { t } = useTranslation()
  const media = useMedia()
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  // Get real auction stats data
  const {
    tokenAddress,
    auctionTokenSymbol,
    launchedOnTimestamp,
    isAuctionInFuture,
    isAuctionEnded,
    auctionSupply,
    totalSupply,
    totalBidCount,
    totalCurrencyRaisedFormatted,
    requiredCurrencyFormatted,
    percentCommittedToLpFormatted,
    impliedTokenPrice,
    metadata,
  } = useAuctionStatsData()

  // Build stat items with real data
  const statItems = buildStatItems({
    t,
    impliedTokenPrice,
    totalBidCount,
    totalCurrencyRaisedFormatted,
    requiredCurrencyFormatted,
    percentCommittedToLpFormatted,
    auctionSupply,
    auctionTokenSymbol,
    totalSupply,
    isAuctionEnded,
  })

  const launchedOnLabel = isAuctionInFuture ? t('toucan.auction.launchesOn') : t('toucan.auction.launchedOn')
  const launchedOnValue = launchedOnTimestamp ? formatTimestampToDate(launchedOnTimestamp) : '--'
  const contractAddress = tokenAddress ?? '--'
  const totalStats = statItems.length

  return (
    <Flex width={400} maxWidth="100%" flexShrink={0} gap="$spacing16" $xl={{ width: 360 }} $lg={{ width: '100%' }}>
      {/* Header */}
      <Text variant={media.lg ? 'subheading1' : 'heading3'}>{t('toucan.auction.stats')}</Text>
      {/* Stats Table */}
      <StatsGrid>
        {statItems.map((item, index) => {
          // Calculate grid position for border/padding logic
          const col = index % STATS_PER_ROW
          const isInFirstRow = index < STATS_PER_ROW

          return (
            <StatCell
              key={`${item.label}-${index}`}
              isLastInRow={col === STATS_PER_ROW - 1}
              isFirstRow={isInFirstRow && totalStats > STATS_PER_ROW}
              hasLeftPadding={col !== 0}
            >
              <Text variant="body3" color="$neutral2">
                {item.label}
              </Text>
              {typeof item.value === 'string' ? (
                <Text variant="subheading1" color="$neutral1">
                  {item.value}
                </Text>
              ) : (
                item.value
              )}
            </StatCell>
          )
        })}
      </StatsGrid>

      {/* Info Section */}
      <Flex gap="$spacing16">
        <Text variant={media.lg ? 'subheading1' : 'heading3'}>{t('toucan.auction.info')}</Text>

        {/* Launched by / Launched on / Contract address row */}
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
            <Flex row gap="$spacing4" alignItems="center">
              <CopyHelper
                toCopy={contractAddress}
                iconPosition="right"
                iconSize={16}
                iconColor="$neutral2"
                alwaysShowIcon
              >
                <Text variant="subheading1" color="$neutral1">
                  {tokenAddress ? shortenAddress({ address: tokenAddress, chars: 4 }) : '--'}
                </Text>
              </CopyHelper>
            </Flex>
          </InfoCell>
        </InfoRow>

        {/* Description - only shown if metadata exists */}
        {metadata?.description && (
          <Flex gap="$spacing8">
            <Text variant="body3" color="$neutral2">
              {t('toucan.auction.description')}
            </Text>
            <Text
              variant="body2"
              color="$neutral1"
              numberOfLines={isDescriptionExpanded ? undefined : 2}
              ellipsizeMode="tail"
            >
              {metadata.description}
            </Text>
            <Text
              variant="buttonLabel3"
              color="$neutral2"
              onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              cursor="pointer"
              hoverStyle={{ color: '$neutral1' }}
            >
              {isDescriptionExpanded ? t('toucan.auction.showLess') : t('toucan.auction.showMore')}
            </Text>
          </Flex>
        )}

        {/* Social badges - only shown if at least one link exists */}
        {/* TODO | Toucan - add analytics tracking for social link clicks */}
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
