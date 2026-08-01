// oxlint-disable-next-line no-restricted-imports -- Used outside React component context where useTranslation is not available
import { TFunction, t } from 'i18next'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, Tooltip, TouchableArea, useMedia } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Lock } from 'ui/src/components/icons/Lock'
import {
  AuctionLiquidityLockData,
  useAuctionLiquidityLock,
} from '~/features/Toucan/Auction/hooks/useAuctionLiquidityLock'
import { useAuctionStatsData } from '~/features/Toucan/Auction/hooks/useAuctionStatsData'

interface StatItem {
  label: string
  labelIcon?: ReactNode // Optional icon rendered next to the label (e.g., lock / info tooltip)
  value: string | ReactNode | undefined
}

interface BuildStatItemsParams {
  t: TFunction
  impliedTokenPrice: { start: string; end?: string } | null // e.g., { start: "0.041589 ETH", end: "0.042626 ETH" }
  totalCurrencyRaisedFormatted: string | null
  requiredCurrencyFormatted: string | null // e.g., "10k ETH"
  percentCommittedToLpFormatted: string | null
  auctionSupply: string | null // Amount being auctioned (auctionDetails.totalSupply)
  auctionTokenSymbol: string | undefined // Token symbol (e.g., "TCAN")
  totalSupply: string | null // Total token supply (auctionDetails.tokenTotalSupply)
  isAuctionEnded: boolean
  liquidityLock: AuctionLiquidityLockData
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
  percentCommittedToLpFormatted,
  auctionSupply,
  auctionTokenSymbol,
  totalSupply,
  isAuctionEnded,
  liquidityLock,
  valueVariant,
}: Pick<
  BuildStatItemsParams,
  | 't'
  | 'impliedTokenPrice'
  | 'percentCommittedToLpFormatted'
  | 'auctionSupply'
  | 'auctionTokenSymbol'
  | 'totalSupply'
  | 'isAuctionEnded'
  | 'liquidityLock'
> & { valueVariant: 'subheading1' | 'subheading2' }): StatItem[] {
  const {
    isLocked,
    isPermanentlyLocked,
    isBuybackEnabled,
    unlockDateFormatted,
    burnedAmountFormatted,
    burnedUsdFormatted,
  } = liquidityLock

  const lockedTooltipText = isPermanentlyLocked
    ? t('toucan.auction.stats.percentLP.locked.tooltip.forever')
    : unlockDateFormatted
      ? t('toucan.auction.stats.percentLP.locked.tooltip', { date: unlockDateFormatted })
      : t('toucan.auction.stats.percentLP.locked.tooltip.noDate')

  const statItems: StatItem[] = [
    {
      label: isAuctionEnded ? t('toucan.statsBanner.finalClearingPrice') : t('toucan.auction.stats.impliedTokenPrice'),
      value: formatImpliedTokenPrice({ impliedTokenPrice, variant: valueVariant, stacked: true }),
    },
    {
      label: t('toucan.details.auctionSupply'),
      value: auctionSupply ? `${auctionSupply} ${auctionTokenSymbol ?? ''}`.trim() : STATS_PLACEHOLDER,
    },
    {
      label: t('toucan.auction.stats.percentLP'),
      labelIcon: isLocked ? (
        <Tooltip placement="top">
          <Tooltip.Trigger>
            <Lock size="$icon.12" color="$statusSuccess" />
          </Tooltip.Trigger>
          <Tooltip.Content>
            <Text variant="body4" color="$neutral1" maxWidth={250}>
              {lockedTooltipText}
            </Text>
          </Tooltip.Content>
        </Tooltip>
      ) : undefined,
      value: percentCommittedToLpFormatted ?? '-',
    },
    {
      label: t('toucan.auction.totalSupply'),
      value: totalSupply ? `${totalSupply} ${auctionTokenSymbol ?? ''}`.trim() : STATS_PLACEHOLDER,
    },
  ]

  if (isBuybackEnabled) {
    statItems.push({
      label: t('toucan.auction.stats.tokensBurned'),
      labelIcon: (
        <Tooltip placement="top">
          <Tooltip.Trigger>
            <InfoCircleFilled size="$icon.12" color="$neutral3" />
          </Tooltip.Trigger>
          <Tooltip.Content>
            <Text variant="body4" color="$neutral1" maxWidth={250}>
              {t('toucan.auction.stats.tokensBurned.tooltip')}
            </Text>
          </Tooltip.Content>
        </Tooltip>
      ),
      value: (
        <Flex>
          <Text variant={valueVariant} color="$neutral1">
            {burnedAmountFormatted ?? STATS_PLACEHOLDER}
          </Text>
          {burnedUsdFormatted && (
            <Text variant="body4" color="$neutral2">
              {burnedUsdFormatted}
            </Text>
          )}
        </Flex>
      ),
    })
  }

  return statItems
}

const STATS_PER_ROW_DESKTOP = 4
// With the buyback & burn stat the grid re-flows to 3 columns x 2 rows
const STATS_PER_ROW_DESKTOP_BUYBACK = 3

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
  variants: {
    columns: {
      ':number': (columns) => ({
        '$platform-web': {
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        },
      }),
    },
  } as const,
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

export const AuctionStatsGrid = ({ onViewAllStats }: { onViewAllStats?: () => void }) => {
  // oxlint-disable-next-line no-shadow
  const { t } = useTranslation()
  const media = useMedia()

  const {
    auctionTokenSymbol,
    isAuctionEnded,
    auctionSupply,
    totalSupply,
    percentCommittedToLpFormatted,
    impliedTokenPrice,
  } = useAuctionStatsData()

  const liquidityLock = useAuctionLiquidityLock()

  const valueVariant = media.lg ? 'subheading2' : 'subheading1'

  const statItems = buildStatItems({
    t,
    impliedTokenPrice,
    percentCommittedToLpFormatted,
    auctionSupply,
    auctionTokenSymbol,
    totalSupply,
    isAuctionEnded,
    liquidityLock,
    valueVariant,
  })

  const statsPerRow = liquidityLock.isBuybackEnabled ? STATS_PER_ROW_DESKTOP_BUYBACK : STATS_PER_ROW_DESKTOP

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
      <StatsGrid columns={statsPerRow}>
        {statItems.map((item, index) => {
          const col = index % statsPerRow
          const isInFirstRow = index < statsPerRow

          return (
            <StatCell
              key={`${item.label}-${index}`}
              isLastInRow={col === statsPerRow - 1}
              isFirstRow={isInFirstRow && statItems.length > statsPerRow}
              hasLeftPadding={col !== 0}
            >
              <Flex row alignItems="center" gap="$spacing4">
                <Text variant="body3" color="$neutral2">
                  {item.label}
                </Text>
                {item.labelIcon}
              </Flex>
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
