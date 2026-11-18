import { fonts, Flex, type Input, Text, TouchableArea, type TouchableAreaEvent } from '@universe/mycelium'
import { ArrowDownArrowUp } from '@universe/mycelium/icons/ArrowDownArrowUp'
import { Minus } from '@universe/mycelium/icons/Minus'
import { Plus } from '@universe/mycelium/icons/Plus'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { type ComponentType, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AmountInput } from 'uniswap/src/components/AmountInput/AmountInput'
import { RangeAmountInputPriceMode } from '~/features/Liquidity/Create/types'
import { isRangeEdgeInputValid } from '~/pages/PoolDetails/components/LiquidityPanel/rangeEditor'

// The collapsed summary's "± x%" headline size, so the value doesn't change size as the editor opens.
const VALUE_FONT = fonts.heading3
// Beside the steppers a narrow box fits ~10 characters at that size; a tiny price's six significant digits
// (0.000435729) don't, so a longer value steps down a size. The line height stays, so the box doesn't jump.
const LONG_VALUE_CHARS = 10
const LONG_VALUE_FONT_SIZE = fonts.subheading1.fontSize

/** One of the create flow's round +/- buttons; a press steps the edge rather than typing into the box. */
function EdgeStepButton({
  Icon,
  label,
  onPress,
}: {
  Icon: ComponentType<{ size: '$icon.16'; color: '$neutral2' }>
  label: string
  /** Undefined when the edge can't move this way. */
  onPress?: () => void
}): JSX.Element {
  return (
    <TouchableArea
      aria-label={label}
      disabled={!onPress}
      alignItems="center"
      justifyContent="center"
      userSelect="none"
      borderRadius="$roundedFull"
      p="$spacing8"
      backgroundColor="$surface2"
      hoverable
      hoverStyle={{ backgroundColor: '$surface2Hovered' }}
      opacity={onPress ? 1 : 0.5}
      onPress={(event: TouchableAreaEvent) => {
        event.stopPropagation()
        onPress?.()
      }}
    >
      <Icon size="$icon.16" color="$neutral2" />
    </TouchableArea>
  )
}

/**
 * One edge of the range editor's Min / Max pair, typed like the create flow's range inputs: the value
 * follows the range until focused, holds what's typed while editing, and hands it to `onCommit` on blur or
 * Enter. The caption under it toggles between percentage and price, and +/- step the edge half a percent,
 * always shown so the box reads as editable. A press anywhere else on the box types into it.
 *
 * Until it's focused the value shows as text with its %, and the input stays mounted, invisible over it, so a
 * click or a tab lands in it as before.
 */
export function PdpRangeEdgeInput({
  label,
  value,
  caption,
  mode,
  disabled = false,
  onCommit,
  onToggleMode,
  onIncrement,
  onDecrement,
}: {
  label: string
  /** The edge in `mode`: a signed percent (without its %) or a price. */
  value: string
  /** The edge in the other mode; tapping it switches modes. */
  caption: string
  mode: RangeAmountInputPriceMode
  disabled?: boolean
  onCommit: (typed: string) => void
  onToggleMode: () => void
  /** Undefined when the edge can't step that way. */
  onIncrement?: () => void
  onDecrement?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const inputRef = useRef<Input>(null)
  // Undefined while not editing, so the shown value tracks drags and preset picks.
  const [typed, setTyped] = useState<string>()
  const [isFocused, setIsFocused] = useState(false)

  const commit = () => {
    if (typed === undefined) {
      return
    }
    setTyped(undefined)
    onCommit(typed)
  }
  const onFocus = () => setIsFocused(true)
  const onBlur = () => {
    setIsFocused(false)
    commit()
  }

  const showPercentSign = mode === RangeAmountInputPriceMode.PERCENTAGE && !disabled
  const shownValue = showPercentSign ? `${value}%` : value
  // From the range's value, not what's typed, so the size holds while editing.
  const valueFontSize = shownValue.length > LONG_VALUE_CHARS ? LONG_VALUE_FONT_SIZE : VALUE_FONT.fontSize
  const focusInput = () => inputRef.current?.focus()
  // The caption switches modes rather than typing, so its press stops short of the box's.
  const onPressCaption = (event: TouchableAreaEvent) => {
    event.stopPropagation()
    onToggleMode()
  }

  return (
    <Flex
      row
      alignItems="center"
      gap="$gap8"
      flex={1}
      flexBasis={0}
      // Unfilled, flat on the panel: the 8px inset lines the text up with the section's label, and the
      // vertical 8 gives the focus outline room around it.
      px="$spacing8"
      py="$spacing8"
      overflow="hidden"
      borderRadius="$rounded12"
      // Only an outline while typing marks the box being edited; the transparent edge reserves its room.
      borderWidth="$spacing1"
      borderColor="$transparent"
      cursor={disabled ? 'default' : 'text'}
      focusWithinStyle={{ borderColor: '$surface3' }}
      onPress={disabled ? undefined : focusInput}
    >
      <Flex flex={1} gap="$gap4" overflow="hidden">
        <Text variant="body3" color="$neutral2">
          {label}
        </Text>
        <Flex row alignItems="center">
          <Flex position="relative" flexShrink={1} minWidth={0} flexGrow={showPercentSign ? 0 : 1}>
            {!isFocused && (
              // The input below carries the value for assistive tech.
              <Text
                aria-hidden
                color="$neutral1"
                fontFamily="$heading"
                fontSize={valueFontSize}
                fontWeight={VALUE_FONT.fontWeight}
                lineHeight={VALUE_FONT.lineHeight}
                whiteSpace="nowrap"
              >
                {shownValue}
              </Text>
            )}
            <AmountInput
              ref={inputRef}
              disabled={disabled}
              backgroundColor="$transparent"
              borderWidth="$none"
              borderRadius="$none"
              color="$neutral1"
              fontFamily="$heading"
              fontSize={valueFontSize}
              fontWeight={VALUE_FONT.fontWeight}
              lineHeight={VALUE_FONT.lineHeight}
              overflow="visible"
              placeholder="0"
              placeholderTextColor={colors.neutral3.val}
              px="$none"
              py="$none"
              // Laid over the shown value until focused, when it takes its place (and the % follows it).
              opacity={isFocused ? 1 : 0}
              position={isFocused ? 'relative' : 'absolute'}
              top={0}
              left={0}
              // The shown value's line box, so the row holds its height as the two swap.
              height={VALUE_FONT.lineHeight}
              width={isFocused ? undefined : '100%'}
              // Hugging the digits keeps the % glyph right after them.
              adjustWidthToContent={showPercentSign && isFocused}
              value={typed ?? value}
              // The raw text, not AmountInput's parsed onChangeText, which strips the sign a percent below needs.
              onChange={(event) => {
                const next = event.nativeEvent.text
                if (isRangeEdgeInputValid(next)) {
                  setTyped(next)
                }
              }}
              onFocus={onFocus}
              onBlur={onBlur}
              onSubmitEditing={commit}
              inputEnforcer={isRangeEdgeInputValid}
            />
          </Flex>
          {showPercentSign && isFocused && (
            <Text
              color="$neutral1"
              fontFamily="$heading"
              fontSize={valueFontSize}
              fontWeight={VALUE_FONT.fontWeight}
              lineHeight={VALUE_FONT.lineHeight}
            >
              %
            </Text>
          )}
        </Flex>
        {disabled ? (
          <Text variant="body4" color="$neutral2" numberOfLines={1}>
            {caption}
          </Text>
        ) : (
          <Flex
            row
            alignItems="center"
            gap="$gap4"
            alignSelf="flex-start"
            maxWidth="100%"
            cursor="pointer"
            hoverStyle={{ opacity: 0.8 }}
            onPress={onPressCaption}
          >
            <ArrowDownArrowUp size="$icon.12" color="$neutral2" flexShrink={0} />
            <Text variant="body4" color="$neutral2" numberOfLines={1} flexShrink={1}>
              {caption}
            </Text>
          </Flex>
        )}
      </Flex>
      {/* A full range has no edge to step, as in the create flow. */}
      {!disabled && (
        <Flex gap="$gap8" flexShrink={0}>
          <EdgeStepButton
            Icon={Plus}
            label={t('pool.liquidityPanel.rangeEdge.increase', { edge: label })}
            onPress={onIncrement}
          />
          <EdgeStepButton
            Icon={Minus}
            label={t('pool.liquidityPanel.rangeEdge.decrease', { edge: label })}
            onPress={onDecrement}
          />
        </Flex>
      )}
    </Flex>
  )
}
