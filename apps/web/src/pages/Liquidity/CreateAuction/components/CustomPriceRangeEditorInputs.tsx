import { isWebPlatform } from '@universe/environment'
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Flex, Input, Text, TouchableArea } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import {
  formatPriceRangeBound,
  normalizeSignedInput,
} from '~/pages/Liquidity/CreateAuction/components/customPriceRangeEditorFormatting'
import {
  CUSTOM_PRICE_RANGE_POSITIVE_INFINITY,
  MIN_CUSTOM_PRICE_RANGE_PERCENT_FROM_CLEARING,
  type CustomPriceRangeValue,
} from '~/pages/Liquidity/CreateAuction/types'
import { isValidPartialPercentInput, isValidPartialSignedPercentInput } from '~/pages/Liquidity/CreateAuction/utils'

function RangeField({ children, isActive }: { children: ReactNode; isActive?: boolean }) {
  return (
    <Flex
      row
      alignItems="center"
      justifyContent="space-between"
      backgroundColor={isActive ? '$surface3' : '$surface2'}
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded8"
      height={32}
      px="$spacing8"
      py="$spacing4"
      gap="$spacing8"
      minWidth={0}
      width="100%"
      flex={1}
      flexBasis={0}
    >
      {children}
    </Flex>
  )
}

export function LiquidityPercentInput({
  value,
  isActive,
  onValueChange,
}: {
  value: number
  isActive: boolean
  onValueChange: (value: number) => void
}) {
  const { formatPercent } = useLocalizationContext()
  const formatFinitePercentValue = useCallback(
    (nextValue: number): string => normalizeSignedInput(formatPercent(nextValue, 4)),
    [formatPercent],
  )
  const [rawInput, setRawInput] = useState(formatFinitePercentValue(value))
  const latestValueRef = useRef(value)
  latestValueRef.current = value

  useLayoutEffect(() => {
    setRawInput(formatFinitePercentValue(value))
  }, [formatFinitePercentValue, value])

  const syncDisplayedPercentFromStoreAfterBlur = () => {
    setTimeout(() => {
      setRawInput(formatFinitePercentValue(latestValueRef.current))
    }, 0)
  }

  return (
    <RangeField isActive={isActive}>
      <Trace logFocus element={ElementName.AuctionCustomRangeLpPct}>
        <Input
          unstyled
          value={rawInput}
          onChangeText={(nextValue) => {
            if (!isValidPartialPercentInput(nextValue)) {
              return
            }
            setRawInput(nextValue)
            const parsed = Number(nextValue)
            if (Number.isFinite(parsed)) {
              onValueChange(parsed)
            }
          }}
          onBlur={() => {
            if (rawInput.trim().length === 0) {
              onValueChange(0)
              setRawInput(formatFinitePercentValue(0))
              return
            }
            const parsed = Number(rawInput)
            if (!Number.isFinite(parsed)) {
              setRawInput(formatFinitePercentValue(latestValueRef.current))
              return
            }
            onValueChange(parsed)
            syncDisplayedPercentFromStoreAfterBlur()
          }}
          placeholder="0"
          placeholderTextColor="$neutral3"
          color="$neutral1"
          outlineStyle="none"
          fontSize={14}
          lineHeight={18}
          flex={1}
          minWidth={0}
        />
      </Trace>
      <Text variant="body3" color="$neutral3" flexShrink={0}>
        %
      </Text>
    </RangeField>
  )
}

export function PriceBoundInput({
  side,
  value,
  isActive,
  onValueChange,
}: {
  side: 'min' | 'max'
  value: CustomPriceRangeValue
  isActive: boolean
  onValueChange: (value: CustomPriceRangeValue) => void
}) {
  const { formatPercent } = useLocalizationContext()
  const formatFinitePercentValue = useCallback(
    (nextValue: number): string => normalizeSignedInput(formatPercent(nextValue, 4)),
    [formatPercent],
  )
  const [rawInput, setRawInput] = useState(formatPriceRangeBound(value, formatFinitePercentValue))
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const isMinBound = side === 'min'
  // Only the max bound supports `+∞`; the min bound is always a finite number.
  const showInfinityButton = !isMinBound && (isHovered || isFocused)
  const valueOnFocusRef = useRef<CustomPriceRangeValue>(value)

  // The clearing price sits at 0%. Each range must straddle it, so the min bound must be ≤ 0
  // and ≥ MIN_CUSTOM_PRICE_RANGE_PERCENT_FROM_CLEARING; the max bound must be ≥ 0. The `+∞` max
  // bound always satisfies its side.
  const finiteValueIncludesClearingPrice = (n: number) =>
    isMinBound ? n >= MIN_CUSTOM_PRICE_RANGE_PERCENT_FROM_CLEARING && n <= 0 : n >= 0

  useLayoutEffect(() => {
    setRawInput(formatPriceRangeBound(value, formatFinitePercentValue))
  }, [formatFinitePercentValue, value])

  const applyInfinityBound = () => {
    setRawInput(formatPriceRangeBound(CUSTOM_PRICE_RANGE_POSITIVE_INFINITY, formatFinitePercentValue))
    onValueChange(CUSTOM_PRICE_RANGE_POSITIVE_INFINITY)
  }

  return (
    <Flex
      flex={1}
      flexBasis={0}
      minWidth={0}
      width="100%"
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
    >
      <RangeField isActive={isActive}>
        <Flex row flex={1} minWidth={0} alignItems="center" gap="$spacing4">
          <Trace
            logFocus
            element={side === 'min' ? ElementName.AuctionCustomRangeMinPrice : ElementName.AuctionCustomRangeMaxPrice}
          >
            <Input
              unstyled
              value={rawInput}
              onChangeText={(nextValue) => {
                const normalized = normalizeSignedInput(nextValue)
                if (!isValidPartialSignedPercentInput(normalized)) {
                  return
                }
                setRawInput(normalized)
                // Keep the store value stable while the field is empty so the placeholder "0"
                // can show during editing instead of being overwritten by `useLayoutEffect`.
                if (normalized.length === 0) {
                  return
                }
                const parsed = Number(normalized)
                if (Number.isFinite(parsed)) {
                  onValueChange(parsed)
                }
              }}
              onFocus={() => {
                setIsFocused(true)
                valueOnFocusRef.current = value
              }}
              onBlur={() => {
                setIsFocused(false)
                const normalized = normalizeSignedInput(rawInput)
                if (normalized.length === 0) {
                  onValueChange(0)
                  setRawInput(formatPriceRangeBound(0, formatFinitePercentValue))
                  return
                }
                // The `+∞` button writes `+∞` into the input (the keyboard validator
                // rejects the symbol, so it can only get there via the button). Preserve it.
                if (!isMinBound && normalized.includes('∞')) {
                  onValueChange(CUSTOM_PRICE_RANGE_POSITIVE_INFINITY)
                  setRawInput(formatPriceRangeBound(CUSTOM_PRICE_RANGE_POSITIVE_INFINITY, formatFinitePercentValue))
                  return
                }
                const parsed = Number(normalized)
                if (!Number.isFinite(parsed) || !finiteValueIncludesClearingPrice(parsed)) {
                  onValueChange(valueOnFocusRef.current)
                  setRawInput(formatPriceRangeBound(valueOnFocusRef.current, formatFinitePercentValue))
                  return
                }
                onValueChange(parsed)
              }}
              placeholder="0"
              placeholderTextColor="$neutral3"
              color="$neutral1"
              outlineStyle="none"
              fontSize={16}
              lineHeight={20}
              flex={1}
              minWidth={0}
            />
          </Trace>
          {!isMinBound && (
            <TouchableArea
              backgroundColor="$surface3"
              borderRadius="$rounded6"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
              height={22}
              overflow="hidden"
              px="$spacing6"
              opacity={showInfinityButton ? 1 : 0}
              pointerEvents={showInfinityButton ? 'auto' : 'none'}
              aria-hidden={!showInfinityButton}
              onMouseDown={
                isWebPlatform
                  ? (event) => {
                      // Avoid focus leaving the input before press runs; blur would hide this control
                      // (pointerEvents none) and cancel the click on web.
                      event.preventDefault()
                    }
                  : undefined
              }
              onPress={applyInfinityBound}
            >
              <Text variant="buttonLabel4" color="$neutral2">
                ∞
              </Text>
            </TouchableArea>
          )}
          <Text variant="body3" color="$neutral3" flexShrink={0}>
            %
          </Text>
        </Flex>
      </RangeField>
    </Flex>
  )
}
