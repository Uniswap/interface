import { Flex, fonts, TouchableArea } from '@universe/mycelium'
import type { GeneratedIcon } from '@universe/mycelium/icons'
import { Minus } from '@universe/mycelium/icons/Minus'
import { Plus } from '@universe/mycelium/icons/Plus'
import { TestID } from '@universe/test'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AmountInput } from 'uniswap/src/components/AmountInput/AmountInput'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import {
  useMarginFormStore,
  useMarginFormStoreActions,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { useEvent } from 'utilities/src/react/hooks'
import { marginLeverageTrackColor } from '~/features/margin/utils/marginFormat'
import { MarginLeverageSlider } from '~/pages/Swap/Margin/components/shared/MarginLeverageSlider'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { floorTo2 } from '~/pages/Swap/Margin/marginAdjustPositionGate'
import { clampLeverage } from '~/pages/Swap/Margin/marginAdjustPositionModalHelpers'
import { MIN_LEVERAGE, shouldClampLeverageToCap } from '~/pages/Swap/Margin/marginOpenButtonGate'

const LEVERAGE_STEP = 0.25
// Fixed readout row: swapping the readout for the edit input must not shift the layout.
const LEVERAGE_READOUT_HEIGHT = 36
const LEVERAGE_INPUT_WIDTH = 88
const STEPPER_SIZE = 24

function formatLeverageReadout(value: number): string {
  return `${Number(value.toFixed(2))}x`
}

function StepButton({
  icon: Icon,
  disabled,
  label,
  onPress,
}: {
  icon: GeneratedIcon
  disabled: boolean
  label: string
  onPress: () => void
}): JSX.Element {
  return (
    <TouchableArea
      width={STEPPER_SIZE}
      height={STEPPER_SIZE}
      borderRadius="$roundedFull"
      backgroundColor="$surface3"
      alignItems="center"
      justifyContent="center"
      disabled={disabled}
      aria-label={label}
      onPress={onPress}
    >
      <Icon size="$icon.12" color="$neutral1" />
    </TouchableArea>
  )
}

// Every control writes `leverage` directly; the open quote debounces it with the amount, so a drag
// re-quotes once it settles rather than per frame.
export function MarginLeverageSection({ derivedMarginInfo }: { derivedMarginInfo: DerivedMarginInfo }): JSX.Element {
  const { t } = useTranslation()
  const leverage = useMarginFormStore((s) => s.leverage)
  const { setMarginFormState } = useMarginFormStoreActions()
  // Manual entry text; defined while the readout is an input.
  const [editText, setEditText] = useState<string | undefined>(undefined)

  const { market, maxLeverage, direction } = derivedMarginInfo
  // Client max over the ALLOWED venues' server-authored caps — known before any quote, from the markets
  // registry. Floored at MIN_LEVERAGE so an unknown ceiling can never clamp leverage under the open floor.
  const cap = Math.max(maxLeverage ?? MIN_LEVERAGE, MIN_LEVERAGE)

  // Floored on the decimal STRING, not via `Math.floor(x * 100) / 100`: `2.3 * 100` is
  // 229.99999999999997, so the float form silently stores 2.29. Flooring (never rounding) also keeps a
  // fractional cap from rounding UP past the backend's cap and 400ing the quote.
  const setLeverage = useEvent((next: number) => {
    setMarginFormState({ leverage: Number(floorTo2(clampLeverage({ leverage: next, min: MIN_LEVERAGE, max: cap }))) })
  })

  useEffect(() => {
    if (shouldClampLeverageToCap({ maxLeverage, leverage, cap })) {
      setLeverage(cap)
    }
  }, [cap, leverage, maxLeverage, setLeverage])

  // Rounded to 2dp before the clamp's floor: 1.89 + 0.25 is 2.1399999999999997, which floors to 2.13.
  const stepLeverage = (sign: 1 | -1): void => setLeverage(Math.round((leverage + sign * LEVERAGE_STEP) * 100) / 100)
  const onStepDown = useEvent(() => stepLeverage(-1))
  const onStepUp = useEvent(() => stepLeverage(1))

  const trackColor = marginLeverageTrackColor({ leverage, lltvWad: market.lltvWad, direction })
  // An unknown LLTV yields the neutral track; the readout stays primary text rather than reading disabled.
  const readoutColor = trackColor === '$neutral3' ? '$neutral1' : trackColor

  const startEditing = useEvent(() => setEditText(String(Number(leverage.toFixed(2)))))
  const commitEdit = useEvent(() => {
    const parsed = Number.parseFloat(editText ?? '')
    if (Number.isFinite(parsed) && parsed > 0) {
      setLeverage(parsed)
    }
    setEditText(undefined)
  })

  return (
    <Flex gap="$spacing12" px="$spacing16" pt="$spacing12" pb="$spacing16">
      <Flex row justifyContent="space-between" alignItems="center" height={LEVERAGE_READOUT_HEIGHT}>
        {editText !== undefined ? (
          <AmountInput
            autoFocus
            value={editText}
            maxDecimals={2}
            selectTextOnFocus
            aria-label={t('margin.leverage.sliderLabel')}
            width={LEVERAGE_INPUT_WIDTH}
            backgroundColor="$transparent"
            borderWidth="$none"
            color={readoutColor}
            px="$none"
            py="$none"
            fontFamily="$heading"
            fontSize={fonts.heading3.fontSize}
            fontWeight={fonts.heading3.fontWeight}
            lineHeight={fonts.heading3.lineHeight}
            onChangeText={setEditText}
            onBlur={commitEdit}
            onSubmitEditing={commitEdit}
          />
        ) : (
          <TouchableArea cursor="text" aria-label={t('margin.leverage.sliderLabel')} onPress={startEditing}>
            {/* Odometer roll without the up/down color flash: leverage is a control, not a market tick. */}
            <AnimatedNumber
              value={formatLeverageReadout(leverage)}
              numericValue={leverage}
              textVariant="$heading3"
              color={readoutColor}
              containerTestID={TestID.MarginLeverageReadout}
            />
          </TouchableArea>
        )}
        <Flex row gap="$spacing8">
          <StepButton
            icon={Minus}
            disabled={leverage <= MIN_LEVERAGE}
            label={t('margin.leverage.decrease')}
            onPress={onStepDown}
          />
          <StepButton icon={Plus} disabled={leverage >= cap} label={t('margin.leverage.increase')} onPress={onStepUp} />
        </Flex>
      </Flex>
      <MarginLeverageSlider
        value={Math.min(leverage, cap)}
        cap={cap}
        trackHeight={8}
        onChange={setLeverage}
        trackColor={trackColor}
        inactiveTrackColor="$surface3"
        thumbColor="$white"
        tickColor="$neutral2"
      />
    </Flex>
  )
}
