import { AuctionStatsData, FAKE_AUCTION_STATS } from 'components/Toucan/Auction/store/mockData'
import { TFunction } from 'i18next'
import { deprecatedStyled } from 'lib/styled-components'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CopyHelper } from 'theme/components/CopyHelper'
import { ExternalLink } from 'theme/components/Links'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, styled, Text } from 'ui/src'
import { Globe } from 'ui/src/components/icons/Globe'
import { XTwitter } from 'ui/src/components/icons/XTwitter'
import { shortenAddress } from 'utilities/src/addresses'

interface StatItem {
  label: string
  value: string | undefined
}

/**
 * Builds the list of stat items to display, filtering out undefined values
 * @param stats - The auction stats data
 * @param t - Translation function
 * @returns Array of stat items with labels and values
 */
function buildStatItems(stats: AuctionStatsData, t: TFunction): StatItem[] {
  return [
    {
      label: t('toucan.auction.impliedTokenPrice'),
      value:
        stats.impliedTokenPriceMin && stats.impliedTokenPriceMax
          ? `${stats.impliedTokenPriceMin} – ${stats.impliedTokenPriceMax}`
          : undefined,
    },
    {
      label: t('toucan.auction.totalBids'),
      value: stats.totalBids.toLocaleString(),
    },
    {
      label: t('toucan.auction.placeholderStat'),
      value: 'xx,xxx',
    },
    {
      label: t('toucan.auction.placeholderStat'),
      value: 'xx,xxx',
    },
    {
      label: t('toucan.auction.circulatingSupply'),
      value: stats.circulatingSupply,
    },
    {
      label: t('toucan.auction.totalSupply'),
      value: stats.totalSupply,
    },
  ].filter((item): item is StatItem => Boolean(item.value))
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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const stats = FAKE_AUCTION_STATS

  // TODO | Toucan: use actual data
  const statItems = buildStatItems(stats, t)

  const totalStats = statItems.length

  return (
    <Flex width={480} maxWidth="100%" flexShrink={0} gap="$spacing16" $lg={{ width: '100%' }}>
      {/* Header */}
      <Text variant="heading3">{t('toucan.auction.stats')}</Text>
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
              <Text variant="body3" color="$neutral2" $md={{ fontSize: 12 }}>
                {item.label}
              </Text>
              <Text variant="subheading1" color="$neutral1" $md={{ fontSize: 14, lineHeight: 18 }}>
                {item.value}
              </Text>
            </StatCell>
          )
        })}
      </StatsGrid>

      {/* Info Section */}
      <Flex gap="$spacing16">
        <Text variant="heading3">{t('toucan.auction.info')}</Text>

        {/* Launched by / Launched on / Contract address row */}
        <InfoRow>
          <InfoCell>
            <Text variant="body3" color="$neutral2" $md={{ fontSize: 12 }}>
              {t('toucan.auction.launchedBy')}
            </Text>
            <Flex row gap="$spacing8" alignItems="center" flexShrink={1} minWidth={0}>
              <CompanyIcon flexShrink={0}>
                <Text variant="body3" fontSize={10} color="$white">
                  F
                </Text>
              </CompanyIcon>
              <Text
                variant="subheading1"
                color="$neutral1"
                $md={{ fontSize: 14, lineHeight: 18 }}
                numberOfLines={1}
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {stats.launchedBy.name}
              </Text>
            </Flex>
          </InfoCell>

          <InfoCell withBorder>
            <Text variant="body3" color="$neutral2" $md={{ fontSize: 12 }}>
              {t('toucan.auction.launchedOn')}
            </Text>
            <Text variant="subheading1" color="$neutral1" $md={{ fontSize: 14, lineHeight: 18 }}>
              {stats.launchedOn}
            </Text>
          </InfoCell>

          <InfoCell withBorder>
            <Text variant="body3" color="$neutral2" $md={{ fontSize: 12 }}>
              {t('toucan.auction.contractAddress')}
            </Text>
            <Flex row gap="$spacing4" alignItems="center">
              <CopyHelper
                toCopy={stats.contractAddress}
                iconPosition="right"
                iconSize={16}
                iconColor="$neutral2"
                alwaysShowIcon
              >
                <Text variant="subheading1" color="$neutral1" $md={{ fontSize: 14, lineHeight: 18 }}>
                  {shortenAddress({ address: stats.contractAddress, chars: 4 })}
                </Text>
              </CopyHelper>
            </Flex>
          </InfoCell>
        </InfoRow>

        {/* Description */}
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
            {stats.description}
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

        {/* Social badges */}
        {/* TODO | Toucan - add analytics tracking for social link clicks */}
        <Flex row gap="$spacing8">
          {stats.website && (
            <StyledExternalLink href={stats.website}>
              <SocialBadge>
                <Globe size={16} color="$neutral2" />
                {t('toucan.auction.website')}
              </SocialBadge>
            </StyledExternalLink>
          )}
          {stats.twitter && (
            <StyledExternalLink href={stats.twitter}>
              <SocialBadge>
                <XTwitter size={16} color="$neutral2" />
                {t('toucan.auction.twitter')}
              </SocialBadge>
            </StyledExternalLink>
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}
