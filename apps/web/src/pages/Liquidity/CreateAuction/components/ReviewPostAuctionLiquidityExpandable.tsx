import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { type PostAuctionLiquidityTier } from '~/pages/Liquidity/CreateAuction/types'
import {
  formatCompactNumberDisplay,
  getPostAuctionLiquidityTierLpDollars,
  isUnboundedTier,
  parseCompactNumberInput,
} from '~/pages/Liquidity/CreateAuction/utils'

/** Row content min height — matches the custom price range review table (Figma node 11223:40234). */
const REVIEW_POST_AUCTION_TIER_ROW_MIN_HEIGHT_PX = 29

function ReviewTierTableRow({
  column1,
  column2,
  rowAlignItems = 'center',
}: {
  column1: ReactNode
  column2: ReactNode
  rowAlignItems?: 'center' | 'flex-start'
}) {
  return (
    <Flex
      row
      alignItems={rowAlignItems}
      gap="$spacing8"
      width="100%"
      px="$spacing8"
      backgroundColor="$transparent"
      borderRadius="$rounded8"
    >
      <Flex
        flex={1}
        flexBasis={0}
        minWidth={0}
        gap="$spacing4"
        row
        width="100%"
        $platform-web={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        }}
      >
        {column1}
        {column2}
      </Flex>
    </Flex>
  )
}

function ReviewTableHeaderLabel({ children }: { children: ReactNode }) {
  return (
    <Flex flex={1} flexBasis={0} minWidth={0} width="100%">
      <Text variant="body4" color="$neutral1" width="100%">
        {children}
      </Text>
    </Flex>
  )
}

function ReviewTierValueCell({ children }: { children: ReactNode }) {
  return (
    <Flex flex={1} flexBasis={0} minWidth={0} width="100%" justifyContent="flex-start">
      {typeof children === 'string' ? (
        <Text variant="body4" color="$neutral1" numberOfLines={2}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Flex>
  )
}

function formatMilestoneLabel({
  tier,
  raiseCurrencySymbol,
  noLimitLabel,
}: {
  tier: PostAuctionLiquidityTier
  raiseCurrencySymbol: string
  noLimitLabel: string
}): string {
  if (isUnboundedTier(tier)) {
    return noLimitLabel
  }
  const parsed = parseCompactNumberInput(tier.raiseMilestone)
  if (parsed === null) {
    return `${tier.raiseMilestone} ${raiseCurrencySymbol}`
  }
  return `${formatCompactNumberDisplay(parsed)} ${raiseCurrencySymbol}`
}

/**
 * Read-only disclosure for tiered post-auction liquidity on the review step.
 * Mirrors `ReviewCustomPriceRangeExpandable`: chevron toggle reveals a 2-column table of tiers
 * (Raise milestone × % of raise milestone to liquidity pool). Unbounded tier: "No limit", or
 * `> {last milestone}` when a bounded tier precedes it (same idea as `PostAuctionLiquidityTieredEditor`).
 */
export function ReviewPostAuctionLiquidityExpandable({
  label,
  summaryLabel,
  tiers,
  raiseCurrencySymbol,
  raiseUsdPrice,
}: {
  label: string
  summaryLabel: string
  tiers: PostAuctionLiquidityTier[]
  raiseCurrencySymbol: string
  /** Raise-token → USD rate (same snapshot as configure / floor price review). When set, tier LP shows in USD next to %. */
  raiseUsdPrice: number | null
}) {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()
  const [expanded, setExpanded] = useState(false)

  const handleToggleExpanded = (): void => {
    setExpanded((prev) => !prev)
  }

  const noLimitLabel = t('toucan.createAuction.step.configureAuction.postAuctionLiquidity.noLimit')

  return (
    <Flex gap="$spacing8" width="100%">
      <Flex row justifyContent="space-between" alignItems="center" width="100%">
        <Text variant="body1" color="$neutral2">
          {label}
        </Text>
        <TouchableArea
          row
          alignItems="center"
          gap="$spacing6"
          onPress={handleToggleExpanded}
          aria-expanded={expanded}
          aria-label={expanded ? t('common.showLess.button') : t('common.showMore.button')}
        >
          <Text variant="body1" color="$neutral1">
            {summaryLabel}
          </Text>
          <RotatableChevron color="$neutral2" direction={expanded ? 'up' : 'down'} size="$icon.16" />
        </TouchableArea>
      </Flex>
      {expanded ? (
        <Flex
          gap={0}
          width="100%"
          backgroundColor="$surface2"
          borderRadius="$rounded12"
          borderWidth="$spacing1"
          borderColor="$surface3"
          pt="$spacing8"
          pb="$spacing12"
          px="$spacing12"
        >
          <Flex minHeight={REVIEW_POST_AUCTION_TIER_ROW_MIN_HEIGHT_PX} width="100%" justifyContent="center">
            <ReviewTierTableRow
              rowAlignItems="flex-start"
              column1={
                <ReviewTableHeaderLabel>
                  {t('toucan.createAuction.step.configureAuction.postAuctionLiquidity.raiseMilestone')}
                </ReviewTableHeaderLabel>
              }
              column2={
                <ReviewTableHeaderLabel>
                  {t(
                    'toucan.createAuction.step.configureAuction.postAuctionLiquidity.percentOfRaiseMilestoneToLiquidityPool',
                  )}
                </ReviewTableHeaderLabel>
              }
            />
          </Flex>
          {(() => {
            let previousMilestone = 0
            return tiers.map((tier, index) => {
              const lpRaiseAmount = getPostAuctionLiquidityTierLpDollars(tier, previousMilestone)

              const parsedMilestone = !isUnboundedTier(tier) ? parseCompactNumberInput(tier.raiseMilestone) : null
              const thresholdRaiseNum =
                parsedMilestone !== null && parsedMilestone > 0
                  ? parsedMilestone
                  : isUnboundedTier(tier) && previousMilestone > 0
                    ? previousMilestone
                    : null

              const raiseMilestoneDisplay = isUnboundedTier(tier)
                ? previousMilestone > 0
                  ? `> ${formatCompactNumberDisplay(previousMilestone)} ${raiseCurrencySymbol}`
                  : noLimitLabel
                : formatMilestoneLabel({ tier, raiseCurrencySymbol, noLimitLabel })

              const milestoneThresholdUsdFormatted =
                raiseUsdPrice !== null && raiseUsdPrice > 0 && thresholdRaiseNum !== null
                  ? convertFiatAmountFormatted(thresholdRaiseNum * raiseUsdPrice, NumberType.FiatTokenStats)
                  : undefined

              if (parsedMilestone !== null && parsedMilestone > 0) {
                previousMilestone = parsedMilestone
              }

              const tierLpUsdFormatted =
                raiseUsdPrice !== null && raiseUsdPrice > 0 && !isUnboundedTier(tier) && lpRaiseAmount > 0
                  ? convertFiatAmountFormatted(lpRaiseAmount * raiseUsdPrice, NumberType.FiatTokenStats)
                  : undefined

              return (
                <Flex
                  key={tier.id}
                  width="100%"
                  minHeight={REVIEW_POST_AUCTION_TIER_ROW_MIN_HEIGHT_PX}
                  justifyContent="center"
                  borderBottomWidth={index < tiers.length - 1 ? 1 : 0}
                  borderBottomColor="$surface3"
                >
                  <ReviewTierTableRow
                    column1={
                      <ReviewTierValueCell>
                        <Flex
                          row
                          alignItems="center"
                          justifyContent="flex-start"
                          gap="$spacing4"
                          flexWrap="wrap"
                          width="100%"
                        >
                          <Text variant="body4" color="$neutral1">
                            {raiseMilestoneDisplay}
                          </Text>
                          {milestoneThresholdUsdFormatted !== undefined ? (
                            <Text variant="body4" color="$neutral2">
                              ({milestoneThresholdUsdFormatted})
                            </Text>
                          ) : null}
                        </Flex>
                      </ReviewTierValueCell>
                    }
                    column2={
                      <ReviewTierValueCell>
                        <Flex
                          row
                          alignItems="center"
                          justifyContent="flex-start"
                          gap="$spacing4"
                          flexWrap="wrap"
                          width="100%"
                        >
                          <Text variant="body4" color="$neutral1">
                            {formatPercent(tier.percent)}
                          </Text>
                          {tierLpUsdFormatted !== undefined ? (
                            <Text variant="body4" color="$neutral2">
                              ({tierLpUsdFormatted})
                            </Text>
                          ) : null}
                        </Flex>
                      </ReviewTierValueCell>
                    }
                  />
                </Flex>
              )
            })
          })()}
        </Flex>
      ) : null}
    </Flex>
  )
}
