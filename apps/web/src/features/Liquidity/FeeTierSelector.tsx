import type { Percent } from '@uniswap/sdk-core'
import type { ReactNode } from 'react'
import { useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, HeightAnimator, styled, Text, TouchableArea } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { BIPS_BASE } from '~/constants/misc'
import { LpIncentivesAprDisplay } from '~/features/Liquidity/LPIncentives/LpIncentivesAprDisplay'
import { getFeeTierKey, isDynamicFeeTier } from '~/features/Liquidity/utils/feeTiers'
import type { FeeData } from '~/types/liquidity'

interface FeeTierOption {
  value: FeeData
  title: string
  selectionPercent?: Percent
  tvl: string | undefined
  boostedApr?: number
}

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
}: {
  feeTier: FeeTierOption
  selected: boolean
  onSelect: (value: FeeData) => void
  isLpIncentivesEnabled?: boolean
}) {
  const { t } = useTranslation()
  const { formatNumberOrString, formatPercent } = useLocalizationContext()

  return (
    <FeeTierContainer
      onPress={onSelect.bind(null, feeTier.value)}
      background={selected ? '$surface3' : '$surface1'}
      justifyContent="space-between"
    >
      <Flex gap="$spacing8">
        <Flex row gap={10} justifyContent="space-between">
          <Text variant="buttonLabel3">
            {feeTier.value.isDynamic ? t('common.dynamic') : formatPercent(feeTier.value.feeAmount / BIPS_BASE, 4)}
          </Text>
          {selected && <CheckCircleFilled size="$icon.16" />}
        </Flex>
        <Text variant="body4">{feeTier.title}</Text>
      </Flex>
      <Flex mt="$spacing16" gap="$spacing2" alignItems="flex-end">
        <Flex row justifyContent="space-between" width="100%" alignItems="flex-end">
          <Flex>
            <Text variant="body4" color="$neutral2">
              {!feeTier.tvl || feeTier.tvl === '0'
                ? '0'
                : formatNumberOrString({ value: feeTier.tvl, type: NumberType.FiatTokenStats })}{' '}
              {t('common.totalValueLocked')}
            </Text>
            {feeTier.selectionPercent && feeTier.selectionPercent.greaterThan(0) && (
              <Text variant="body4" color="$neutral2">
                {t('fee.tier.percent.select', {
                  percentage: formatPercent(feeTier.selectionPercent.toSignificant(), 3),
                })}
              </Text>
            )}
          </Flex>
          {isLpIncentivesEnabled && feeTier.boostedApr !== undefined && feeTier.boostedApr > 0 && (
            <LpIncentivesAprDisplay lpIncentiveRewardApr={feeTier.boostedApr} isSmall />
          )}
        </Flex>
      </Flex>
    </FeeTierContainer>
  )
}

export function FeeTierSelector({
  selectedFee,
  onFeeSelect,
  feeTiers,
  disabled,
  isLpIncentivesEnabled,
  hasLpRewards,
  headerInlineContent,
  headerSubContent,
  footerContent,
  expandedFooterContent,
  isExpanded: controlledExpanded,
  onToggleExpand,
}: FeeTierSelectorProps) {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const [uncontrolledExpanded, toggleUncontrolled] = useReducer((s: boolean) => !s, false)

  const isShowMore = controlledExpanded !== undefined ? controlledExpanded : uncontrolledExpanded
  const toggleShowMore = onToggleExpand ?? toggleUncontrolled

  return (
    <Flex gap="$spacing8" pointerEvents={disabled ? 'none' : 'auto'} opacity={disabled ? 0.5 : 1}>
      <Flex borderRadius="$rounded12" borderWidth="$spacing1" borderColor="$surface3">
        <Flex row gap="$spacing24" justifyContent="space-between" alignItems="center" py="$spacing12" px="$spacing16">
          <Flex gap="$gap4" flex={1} minWidth={0}>
            <Flex row gap="$gap8" alignItems="center">
              <Text variant="subheading2" color={selectedFee ? '$neutral1' : '$neutral2'}>
                {!selectedFee
                  ? t('fee.tier.default')
                  : isDynamicFeeTier(selectedFee)
                    ? t('fee.tier.dynamic')
                    : t('fee.tierExact', { fee: formatPercent(selectedFee.feeAmount / BIPS_BASE, 4) })}
              </Text>
              {headerInlineContent}
            </Flex>
            <Text variant="body3" color="$neutral2">
              {t('fee.tier.label')}
            </Text>
            {headerSubContent}
          </Flex>
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
        </Flex>
        {footerContent}
      </Flex>
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
            {feeTiers.map((feeTier) => (
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
              />
            ))}
          </Flex>
          {expandedFooterContent}
        </Flex>
      </HeightAnimator>
    </Flex>
  )
}
