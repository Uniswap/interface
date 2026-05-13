import { isWebPlatform } from '@universe/environment'
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Flex, Input, Text, TouchableArea } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  formatPriceRangeBound,
  normalizeSignedInput,
} from '~/pages/Liquidity/CreateAuction/components/customPriceRangeEditorFormatting'
import { CustomPriceRangeBound, type CustomPriceRangeValue } from '~/pages/Liquidity/CreateAuction/types'
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
      <Text variant="body3" color="$neutral3" flexShrink={0}>
        %
      </Text>
    </RangeField>
  )
}

export function PriceBoundInput({
  value,
  infinityValue,
  infinityLabel,
  isActive,
  onValueChange,
}: {
  value: CustomPriceRangeValue
  infinityValue: CustomPriceRangeBound
  infinityLabel: string
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
  const showInfinityButton = isHovered || isFocused

  useLayoutEffect(() => {
    setRawInput(formatPriceRangeBound(value, formatFinitePercentValue))
  }, [formatFinitePercentValue, value])

  const applyInfinityBound = () => {
    setRawInput(formatPriceRangeBound(infinityValue, formatFinitePercentValue))
    onValueChange(infinityValue)
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
          <Input
            unstyled
            value={rawInput}
            onChangeText={(nextValue) => {
              const normalized = normalizeSignedInput(nextValue)
              if (!isValidPartialSignedPercentInput(normalized)) {
                return
              }
              setRawInput(normalized)
              const parsed = Number(normalized)
              if (Number.isFinite(parsed)) {
                onValueChange(parsed)
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false)
              const parsed = Number(normalizeSignedInput(rawInput))
              if (!Number.isFinite(parsed)) {
                setRawInput(formatPriceRangeBound(value, formatFinitePercentValue))
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
              {infinityLabel}
            </Text>
          </TouchableArea>
          <Text variant="body3" color="$neutral3" flexShrink={0}>
            %
          </Text>
        </Flex>
      </RangeField>
    </Flex>
  )
}
