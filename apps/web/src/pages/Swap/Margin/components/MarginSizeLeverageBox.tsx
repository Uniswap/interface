import { Flex, fonts, Text, TouchableArea } from '@universe/mycelium'
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
import { MARGIN_INPUT_FONT_SIZES } from '~/pages/Swap/Margin/marginFormConstants'
import { MIN_LEVERAGE, shouldClampLeverageToCap } from '~/pages/Swap/Margin/marginOpenButtonGate'

const READOUT_HEIGHT = 36
const READOUT_MAX_WIDTH = 88
const FONT_SIZE = MARGIN_INPUT_FONT_SIZES.maxFontSize

export function formatLeverageReadout(value: number): string {
  return Number.isFinite(value) ? `${Number(value.toFixed(2))}x` : '∞x'
}

// Web-only file: the focus event's target is the DOM input.
function placeCaretAtEnd(e: { currentTarget: unknown }): void {
  if (e.currentTarget instanceof HTMLInputElement) {
    e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)
  }
}

const FIGURE_FONT = {
  fontFamily: '$heading',
  fontSize: FONT_SIZE,
  fontWeight: fonts.heading3.fontWeight,
  lineHeight: READOUT_HEIGHT,
} as const

export interface MarginLeverageControl {
  leverage: number
  cap: number
  trackColor: ReturnType<typeof marginLeverageTrackColor>
  editText: string | undefined
  setLeverage: (next: number) => void
  setEditText: (text: string) => void
  startEditing: () => void
  commitEdit: () => void
}

// The open form's leverage state: the cap clamp and the type-in's commit.
function useMarginLeverageControl({ market, maxLeverage, direction }: DerivedMarginInfo): MarginLeverageControl {
  const leverage = useMarginFormStore((s) => s.leverage)
  const { setMarginFormState } = useMarginFormStoreActions()
  const [editText, setEditText] = useState<string | undefined>(undefined)
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

  const trackColor = marginLeverageTrackColor({ leverage, lltvWad: market.lltvWad, direction })

  const startEditing = useEvent(() => setEditText(String(Number(leverage.toFixed(2)))))
  const commitEdit = useEvent(() => {
    const parsed = Number.parseFloat(editText ?? '')
    if (Number.isFinite(parsed) && parsed > 0) {
      setLeverage(parsed)
    }
    setEditText(undefined)
  })
  return { leverage, cap, setLeverage, trackColor, editText, setEditText, startEditing, commitEdit }
}

// The 28px leverage in its health-tier color; pressing it opens the type-in, caret at the end.
function MarginLeverageReadout({
  control,
  onPress,
}: {
  control: MarginLeverageControl
  onPress: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { leverage, trackColor, editText } = control
  // An unknown LLTV yields the neutral track; the readout stays primary text rather than reading disabled.
  const readoutColor = trackColor === '$neutral3' ? '$neutral1' : trackColor
  if (editText === undefined) {
    return (
      <TouchableArea cursor="pointer" aria-label={t('margin.leverage.sliderLabel')} onPress={onPress}>
        {/* AnimatedNumber sizes its digit cells from a text variant and none is 28px; CSS zoom
            (web-only file) scales the heading3 roll and its layout box with it. */}
        <Flex style={{ zoom: FONT_SIZE / fonts.heading3.fontSize }}>
          <AnimatedNumber
            value={formatLeverageReadout(leverage)}
            numericValue={leverage}
            textVariant="$heading3"
            color={readoutColor}
            containerTestID={TestID.MarginLeverageReadout}
          />
        </Flex>
      </TouchableArea>
    )
  }
  return (
    <Flex row alignItems="center">
      <AmountInput
        autoFocus
        value={editText}
        maxDecimals={2}
        aria-label={t('margin.leverage.sliderLabel')}
        adjustWidthToContent
        maxWidth={READOUT_MAX_WIDTH}
        backgroundColor="$transparent"
        borderWidth="$none"
        color={readoutColor}
        px="$none"
        py="$none"
        textAlign="left"
        {...FIGURE_FONT}
        onFocus={placeCaretAtEnd}
        onChangeText={control.setEditText}
        onBlur={control.commitEdit}
        onSubmitEditing={control.commitEdit}
      />
      {/* Trails the caret; a press on it keeps the input focused instead of committing it. */}
      <Text aria-hidden userSelect="none" color="$neutral3" {...FIGURE_FONT} onMouseDown={(e) => e.preventDefault()}>
        x
      </Text>
    </Flex>
  )
}

function MarginLeverageControlSlider({ control }: { control: MarginLeverageControl }): JSX.Element {
  return (
    <MarginLeverageSlider
      value={Math.min(control.leverage, control.cap)}
      cap={control.cap}
      trackHeight={8}
      onChange={control.setLeverage}
      trackColor={control.trackColor}
      inactiveTrackColor="$surface3"
      thumbColor="$white"
      thumbBorderColor="$neutral3"
      tickColor="$neutral2"
    />
  )
}

// The Deposit card's Leverage row when Size has its own box: the readout beside an always-open slider.
export function MarginLeverageSection({ derivedMarginInfo }: { derivedMarginInfo: DerivedMarginInfo }): JSX.Element {
  return <MarginLeverageControlView control={useMarginLeverageControl(derivedMarginInfo)} />
}

export function MarginLeverageControlView({ control }: { control: MarginLeverageControl }): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex gap="$spacing8" px="$spacing16" pt="$spacing12" pb="$spacing16">
      <Text color="$neutral2" variant="subheading2" fontSize="$small">
        {t('margin.leverage.sliderLabel')}
      </Text>
      <Flex row alignItems="center" gap="$spacing12">
        <Flex width={READOUT_MAX_WIDTH} flexShrink={0}>
          <MarginLeverageReadout control={control} onPress={control.startEditing} />
        </Flex>
        <Flex fill minWidth={0}>
          <MarginLeverageControlSlider control={control} />
        </Flex>
      </Flex>
    </Flex>
  )
}
