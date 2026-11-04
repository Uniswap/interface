import { Flex, Text, fonts } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { AmountInput } from 'uniswap/src/components/AmountInput/AmountInput'
import type { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { marginLeverageTrackColor } from '~/features/margin/utils/marginFormat'
import { MarginLeverageSlider } from '~/pages/Swap/Margin/components/shared/MarginLeverageSlider'

// Leverage card for the Change-leverage modal: editable numeric leverage + slider (value already resolved
// by the caller per the drift/explicit mode). Carded so the control reads apart from the bare consequence
// rows below.
// `toFixed` on a non-finite number writes the literal string "Infinity" into the field. +Infinity is a
// real answer here — the projection lands at or past liquidation — so it is rendered, not swallowed:
// the alternative (substituting the position's current leverage) shows the most dangerous state on this
// sheet as "nothing is changing". The slider pins at its ceiling and the track colour reads at-risk
// alongside it.
function formatLeverageValue(leverage: number): string {
  return Number.isFinite(leverage) ? leverage.toFixed(2) : '∞'
}

export function MarginAdjustLeverageSection({
  displayedLeverage,
  leverageDraft,
  cap,
  lltvWad,
  direction,
  onLeverageDraftChange,
  onCommitLeverageDraft,
  onSliderChange,
}: {
  displayedLeverage: number
  leverageDraft?: string
  cap: number
  // Tints the track by the health tier this leverage implies — see marginHealthFromLeverage. The
  // implied LTV differs by direction, so the tier does too.
  lltvWad: string
  direction: MarginDirection | undefined
  onLeverageDraftChange: (text: string) => void
  onCommitLeverageDraft: () => void
  onSliderChange: (next: number) => void
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex gap="$spacing8" p="$spacing16" borderRadius="$rounded20" backgroundColor="$surface2">
      <Text variant="body3" color="$neutral2">
        {t('margin.manage.leverage')}
      </Text>
      <Flex row alignItems="center" gap="$spacing4">
        <AmountInput
          value={leverageDraft ?? formatLeverageValue(displayedLeverage)}
          adjustWidthToContent
          maxDecimals={2}
          selectTextOnFocus
          aria-label={t('margin.leverage.sliderLabel')}
          backgroundColor="$transparent"
          borderWidth="$none"
          color="$neutral1"
          px="$none"
          py="$none"
          fontFamily="$heading"
          fontSize={fonts.heading2.fontSize}
          fontWeight={fonts.heading2.fontWeight}
          lineHeight={fonts.heading2.lineHeight}
          overflow="visible"
          onChangeText={onLeverageDraftChange}
          onBlur={onCommitLeverageDraft}
          onSubmitEditing={onCommitLeverageDraft}
        />
        <Text
          color="$neutral2"
          fontFamily="$heading"
          fontSize={fonts.heading2.fontSize}
          fontWeight={fonts.heading2.fontWeight}
        >
          x
        </Text>
      </Flex>
      <MarginLeverageSlider
        value={displayedLeverage}
        cap={cap}
        trackColor={marginLeverageTrackColor({ leverage: displayedLeverage, lltvWad, direction })}
        onChange={onSliderChange}
      />
    </Flex>
  )
}
