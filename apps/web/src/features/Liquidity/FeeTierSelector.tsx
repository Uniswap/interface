import type { ReactNode } from 'react'
import { useMemo, useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, HeightAnimator, styled, Text, Tooltip, TouchableArea } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { FeeDisplay } from 'uniswap/src/components/FeeDisplay/FeeDisplay'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import type { FeeBreakdown } from 'uniswap/src/features/fees/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { NumberType } from 'utilities/src/format/types'
import { BIPS_BASE } from '~/constants/misc'
import { LpIncentivesAprDisplay } from '~/features/Liquidity/LPIncentives/LpIncentivesAprDisplay'
import { type FeeTierOption, getFeeTierKey, isDynamicFeeTier } from '~/features/Liquidity/utils/feeTiers'

interface FeeTierSelectorProps {
  selectedFee: FeeData | undefined
  onFeeSelect: (fee: FeeData) => void
  feeTiers: FeeTierOption[]
  disabled?: boolean
  isLpIncentivesEnabled?: boolean
  hasLpRewards?: boolean
  // Content rendered inline after the selected fee text (e.g. "Highest TVL" / "New tier" badges, LP APR)
  headerInlineContent?: ReactNode
  // Content rendered below the fee tier subtitle (e.g. responsive LP APR display)
  headerSubContent?: ReactNode
  footerContent?: ReactNode
  // Content rendered inside the HeightAnimator after the fee tier grid (e.g. search button)
  expandedFooterContent?: ReactNode
  // Replaces the expand/collapse button in the header (e.g. a "Create fee tier" CTA when all tiers exist)
  headerAction?: ReactNode
  // Dynamic fee tiers require a hook — excluded by default
  allowDynamicFee?: boolean
  // Renders only the header card with the selected fee — no expand button or tier grid (e.g. v2's fixed 0.3% fee)
  readOnly?: boolean
  // Breakdown for the selected fee, rendered through FeeDisplay in the header (used by v2's fixed-fee display,
  // which has no tier boxes to hang the tooltip on)
  selectedFeeBreakdown?: FeeBreakdown
  // Optional controlled expand state; uncontrolled (internal state) if omitted
  isExpanded?: boolean
  onToggleExpand?: () => void
}

const FeeTierContainer = styled(TouchableArea, {
  flex: 1,
  width: '100%',
  p: '$spacing12',
  gap: '$spacing8',
  borderRadius: '$rounded12',
  borderWidth: 1,
  borderColor: '$surface3',
  position: 'relative',
})

function FeeTier({
  feeTier,
  selected,
  onSelect,
  isLpIncentivesEnabled,
  showTvl,
}: {
  feeTier: FeeTierOption
  selected: boolean
  onSelect: (value: FeeData) => void
  isLpIncentivesEnabled?: boolean
  showTvl: boolean
}) {
  const { t } = useTranslation()
  const { formatNumberOrString, formatPercent } = useLocalizationContext()
  const disabled = Boolean(feeTier.disabledReason)

  const tier = (
    <FeeTierContainer
      onPress={disabled ? undefined : onSelect.bind(null, feeTier.value)}
      background={selected ? '$surface3' : '$surface1'}
      justifyContent="space-between"
      opacity={disabled ? 0.54 : 1}
      cursor={disabled ? 'default' : 'pointer'}
      hoverable={!disabled}
    >
      <Flex gap="$spacing8">
        <Flex row gap={10} justifyContent="space-between">
          {/* v4 tiers headline the LP fee and reveal protocol + all-in on hover via FeeDisplay's tooltip. */}
          <FeeDisplay feeBreakdown={feeTier.value.isDynamic ? undefined : feeTier.feeBreakdown}>
            <Text variant="buttonLabel3">
              {feeTier.value.isDynamic ? t('common.dynamic') : formatPercent(feeTier.value.feeAmount / BIPS_BASE, 4)}
            </Text>
          </FeeDisplay>
          {selected && <CheckCircleFilled size="$icon.16" />}
        </Flex>
        <Text variant="body4">{feeTier.title}</Text>
      </Flex>
      <Flex mt="$spacing16" gap="$spacing2" alignItems="flex-end">
        <Flex row justifyContent="space-between" width="100%" alignItems="flex-end">
          <Flex>
            {feeTier.created === false ? (
              // A not-yet-created tier (e.g. a v4 new-default) has no pool, so show its status here.
              <Text variant="body4" color="$neutral2">
                {t('common.notCreated.label')}
              </Text>
            ) : (
              <>
                {showTvl && (
                  <Text variant="body4" color="$neutral2">
                    {!feeTier.tvl || feeTier.tvl === '0'
                      ? '0'
                      : formatNumberOrString({ value: feeTier.tvl, type: NumberType.FiatTokenStats })}{' '}
                    {t('common.totalValueLocked')}
                  </Text>
                )}
                {feeTier.selectionPercent && feeTier.selectionPercent.greaterThan(0) && (
                  <Text variant="body4" color="$neutral2">
                    {t('fee.tier.percent.select', {
                      percentage: formatPercent(feeTier.selectionPercent.toSignificant(), 3),
                    })}
                  </Text>
                )}
              </>
            )}
          </Flex>
          {isLpIncentivesEnabled && feeTier.boostedApr !== undefined && feeTier.boostedApr > 0 && (
            <LpIncentivesAprDisplay lpIncentiveRewardApr={feeTier.boostedApr} isSmall />
          )}
        </Flex>
      </Flex>
    </FeeTierContainer>
  )

  if (disabled && feeTier.disabledReason) {
    return (
      <Tooltip placement="top">
        <Tooltip.Trigger flex={1} width="100%" alignSelf="stretch">
          {tier}
        </Tooltip.Trigger>
        {/* pointerEvents="auto" lets the Learn more link receive clicks (see DisconnectButton) */}
        <Tooltip.Content maxWidth={280} pointerEvents="auto">
          <Tooltip.Arrow />
          <Flex gap="$spacing4">
            <Text variant="body4" color="$neutral1">
              {feeTier.disabledReason}
            </Text>
            {feeTier.disabledReasonLearnMoreUrl && (
              <LearnMoreLink url={feeTier.disabledReasonLearnMoreUrl} textVariant="buttonLabel4" textColor="$accent1" />
            )}
          </Flex>
        </Tooltip.Content>
      </Tooltip>
    )
  }

  return tier
}

export function FeeTierSelector({
  selectedFee,
  onFeeSelect,
  feeTiers,
  disabled,
  isLpIncentivesEnabled,
  hasLpRewards,
  allowDynamicFee,
  headerInlineContent,
  headerSubContent,
  footerContent,
  expandedFooterContent,
  headerAction,
  readOnly,
  selectedFeeBreakdown,
  isExpanded: controlledExpanded,
  onToggleExpand,
}: FeeTierSelectorProps) {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const [uncontrolledExpanded, toggleUncontrolled] = useReducer((s: boolean) => !s, false)

  const filteredFeeTiers = useMemo(
    () => (allowDynamicFee ? feeTiers : feeTiers.filter((tier) => !isDynamicFeeTier(tier.value))),
    [feeTiers, allowDynamicFee],
  )

  const isShowMore = controlledExpanded !== undefined ? controlledExpanded : uncontrolledExpanded
  const toggleShowMore = onToggleExpand ?? toggleUncontrolled
  const hasAnyTvl = filteredFeeTiers.some((tier) => tier.tvl && tier.tvl !== '0')

  return (
    <Flex gap="$spacing8" pointerEvents={disabled ? 'none' : 'auto'} opacity={disabled ? 0.5 : 1}>
      <Flex borderRadius="$rounded12" borderWidth="$spacing1" borderColor="$surface3">
        <Flex row gap="$spacing24" justifyContent="space-between" alignItems="center" py="$spacing12" px="$spacing16">
          <Flex gap="$gap4" flex={1} minWidth={0}>
            <Flex row gap="$gap8" alignItems="center">
              {/* v2's fixed fee has no tier boxes, so its LP fee + hover breakdown live here via FeeDisplay. */}
              <FeeDisplay
                feeBreakdown={selectedFee && !isDynamicFeeTier(selectedFee) ? selectedFeeBreakdown : undefined}
              >
                <Text variant="subheading2" color={selectedFee ? '$neutral1' : '$neutral2'}>
                  {!selectedFee
                    ? t('fee.tier.default')
                    : isDynamicFeeTier(selectedFee)
                      ? t('fee.tier.dynamic')
                      : t('fee.tierExact', { fee: formatPercent(selectedFee.feeAmount / BIPS_BASE, 4) })}
                </Text>
              </FeeDisplay>
              {headerInlineContent}
            </Flex>
            <Text variant="body3" color="$neutral2">
              {t('fee.tier.label')}
            </Text>
            {headerSubContent}
          </Flex>
          {!readOnly &&
            (headerAction ?? (
              <Button
                fill={false}
                size="xsmall"
                maxWidth="fit-content"
                emphasis="secondary"
                onPress={toggleShowMore}
                $md={{ width: 32 }}
                icon={<RotatableChevron direction={isShowMore ? 'up' : 'down'} size="$icon.20" />}
                iconPosition="after"
              >
                {isShowMore ? t('common.less') : t('common.more')}
              </Button>
            ))}
        </Flex>
        {footerContent}
      </Flex>
      {!readOnly && (
        <HeightAnimator open={isShowMore}>
          <Flex flexDirection="column" display="flex" gap="$gap12">
            <Flex
              $platform-web={{
                display: 'grid',
              }}
              gridTemplateColumns={hasLpRewards ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'}
              $md={{
                gridTemplateColumns: hasLpRewards ? 'repeat(1, 1fr)' : 'repeat(2, 1fr)',
              }}
              gap={10}
            >
              {filteredFeeTiers.map((feeTier) => (
                <FeeTier
                  key={getFeeTierKey({
                    feeTier: feeTier.value.feeAmount,
                    tickSpacing: feeTier.value.tickSpacing,
                    isDynamicFee: feeTier.value.isDynamic,
                  })}
                  feeTier={feeTier}
                  selected={
                    !!selectedFee &&
                    getFeeTierKey({
                      feeTier: feeTier.value.feeAmount,
                      tickSpacing: feeTier.value.tickSpacing,
                      isDynamicFee: feeTier.value.isDynamic,
                    }) ===
                      getFeeTierKey({
                        feeTier: selectedFee.feeAmount,
                        tickSpacing: selectedFee.tickSpacing,
                        isDynamicFee: selectedFee.isDynamic,
                      })
                  }
                  onSelect={onFeeSelect}
                  isLpIncentivesEnabled={isLpIncentivesEnabled}
                  showTvl={hasAnyTvl}
                />
              ))}
            </Flex>
            {expandedFooterContent}
          </Flex>
        </HeightAnimator>
      )}
    </Flex>
  )
}
