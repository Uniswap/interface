import { Flex, useIsShortMobileDevice } from '@universe/mycelium'
import {
  forwardRef,
  memo,
  type RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { type TextInputProps } from 'uniswap/src/components/input/TextInput'
import { DecimalPad } from 'uniswap/src/features/transactions/components/DecimalPadInput/DecimalPad'
import { KeyAction, type KeyLabel } from 'uniswap/src/features/transactions/components/DecimalPadInput/types'
import { maxDecimalsReached } from 'utilities/src/format/truncateToMaxDecimals'
import { isNumeric, isSafeNumber } from 'utilities/src/primitives/integer'
import { useEvent } from 'utilities/src/react/hooks'

const LONG_PRESS_DELETE_INTERVAL_MS = 20
const LONG_PRESS_DELETE_INTERVAL_DELIMITER_MS = 750

type DisableKeyCondition = (value: string) => boolean

type DecimalPadInputProps = {
  disabled?: boolean
  hideDecimal?: boolean
  onReady: () => void
  resetSelection: (args: { start: number; end?: number; value?: string }) => void
  selectionRef: React.MutableRefObject<TextInputProps['selection']>
  setValue: (newValue: string) => void
  valueRef: React.MutableRefObject<string>
  maxDecimals: number
  onTriggerInputShakeAnimation: () => void
}

export type DecimalPadInputRef = {
  updateDisabledKeys(): void
  setMaxHeight(height: number): void
}

export enum DecimalPadCalculatedSpaceId {
  Swap = 0,
  Send = 1,
  FiatOnRamp = 2,
  EarnDeposit = 3,
}

// Cache the raw space available to the screen, not the already-adjusted keypad height. Consumers
// can change their accessory rows while mounted (for example, Earn Deposit -> Withdraw), so the
// current additionalElementsHeight must be applied every time.
const precalculatedSpace: Partial<Record<DecimalPadCalculatedSpaceId, number | undefined>> = {}

function hasDecimalSeparator(v: string): boolean {
  return v.includes('.')
}

/*
This component is used to calculate the space that the `DecimalPad` can use.
We position the `DecimalPad` with `position: absolute` at the bottom of the screen instead of
putting it inside this container in order to avoid any overflows while the `DecimalPad`
is automatically resizing to find the right size for the screen.
*/
export function DecimalPadCalculateSpace({
  id,
  decimalPadRef,
  additionalElementsHeight = 0,
  isDecimalPadReady = false,
}: {
  id: DecimalPadCalculatedSpaceId
  decimalPadRef: RefObject<DecimalPadInputRef | null>
  additionalElementsHeight?: number
  /** Used to optimistically set the height of the `DecimalPad` if it has already been rendered. */
  isDecimalPadReady?: boolean
}): JSX.Element {
  const isShortMobileDevice = useIsShortMobileDevice()
  const precalculatedBottomScreenHeight = precalculatedSpace[id]

  const [bottomScreenHeight, setBottomScreenHeight] = useState<number | null>(precalculatedBottomScreenHeight ?? null)

  useLayoutEffect(() => {
    if (precalculatedBottomScreenHeight !== undefined) {
      decimalPadRef.current?.setMaxHeight(precalculatedBottomScreenHeight - additionalElementsHeight)
    }
  }, [additionalElementsHeight, precalculatedBottomScreenHeight, decimalPadRef])

  const onBottomScreenLayout = useEvent((event: LayoutChangeEvent): void => {
    if (precalculatedBottomScreenHeight !== undefined) {
      setBottomScreenHeight(precalculatedBottomScreenHeight)
      decimalPadRef.current?.setMaxHeight(precalculatedBottomScreenHeight - additionalElementsHeight)
      return
    }

    const height = event.nativeEvent.layout.height

    setBottomScreenHeight(height)
    // We call `setMaxHeight` even if `additionalElementsHeight` is not set yet,
    // because sometimes it won't be set at all if there are no additional elements.
    decimalPadRef.current?.setMaxHeight(height - additionalElementsHeight)
  })

  useEffect(() => {
    if (!bottomScreenHeight) {
      // There can be a race condition where either `bottomScreenHeight` or `additionalElementsHeight`
      // could be ready first. If `bottomScreenHeight` is not ready yet, we skip this and
      // then `setMaxHeight` will be called from within `onBottomScreenLayout`.
      return
    }
    decimalPadRef.current?.setMaxHeight(bottomScreenHeight - additionalElementsHeight)
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [additionalElementsHeight])

  useEffect(() => {
    if (isDecimalPadReady === true && bottomScreenHeight && precalculatedBottomScreenHeight === undefined) {
      // If we have already rendered this screen, we already know how much space this phone has,
      // so we optimistically set the height instead of waiting for the layout event.
      // This improves the perceived loading time of the `DecimalPad`,
      // given that it fades in only after the height is known.
      const height = bottomScreenHeight - additionalElementsHeight
      decimalPadRef.current?.setMaxHeight(height)
      precalculatedSpace[id] = bottomScreenHeight
    }
  }, [
    isDecimalPadReady,
    bottomScreenHeight,
    id,
    additionalElementsHeight,
    precalculatedBottomScreenHeight,
    decimalPadRef,
  ])

  return <Flex fill mt={isShortMobileDevice ? '$spacing2' : '$spacing8'} onLayout={onBottomScreenLayout} />
}

export const DecimalPadInput = memo(
  forwardRef<DecimalPadInputRef, DecimalPadInputProps>(function DecimalPadInput(
    {
      disabled,
      hideDecimal,
      onReady,
      resetSelection,
      selectionRef,
      setValue,
      valueRef,
      maxDecimals,
      onTriggerInputShakeAnimation,
    },
    ref,
  ): JSX.Element {
    const [disabledKeys, setDisabledKeys] = useState<Partial<Record<KeyLabel, boolean>>>({})
    const [maxHeight, setMaxHeight] = useState<number | null>(null)

    useEffect(() => {
      updateDisabledKeys(valueRef.current)
      // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
    }, [valueRef, selectionRef, maxDecimals])

    useImperativeHandle(ref, () => ({
      updateDisabledKeys(): void {
        updateDisabledKeys(valueRef.current)
      },
      setMaxHeight(height: number): void {
        setMaxHeight(height)
      },
    }))

    const getCurrentSelection = useCallback(() => {
      const selection = selectionRef.current
      return { start: selection?.start, end: selection?.end }
    }, [selectionRef])

    const isCursorBeforeDecimalSeparator = useCallback(
      (v: string): boolean => {
        const { start } = getCurrentSelection()
        const dotIndex = v.indexOf('.')

        // If no dot exists, we can insert freely, otherwise, check if the cursor is before it
        if (dotIndex === -1) {
          return true
        }

        // If dot exists, check if the cursor is before the dot
        return start !== undefined && start <= dotIndex
      },
      [getCurrentSelection],
    )

    const disableKeysConditions = useMemo<Partial<Record<KeyLabel, DisableKeyCondition>>>(() => {
      const disableOnMaxDecimals = (v: string): boolean => {
        // If there's no decimal separator or cursor is before it, always allow input no need to check decimals
        if (!hasDecimalSeparator(v) || isCursorBeforeDecimalSeparator(v)) {
          return false
        }
        // Otherwise check if we've reached max decimals
        return maxDecimalsReached({ value: v, maxDecimals })
      }

      const numericKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

      const disableConditions: Partial<Record<KeyLabel, DisableKeyCondition>> = {}

      // Adding conditions for numeric keys
      numericKeys.forEach((key) => {
        disableConditions[key] = disableOnMaxDecimals
      })

      // Adding condition for the dot key
      disableConditions['.'] = hasDecimalSeparator

      // Adding condition for the backspace key
      disableConditions.backspace = (v: string): boolean => {
        const { start, end } = getCurrentSelection()
        const cursorAtStart = start === 0 && end === 0
        return cursorAtStart || v.length === 0
      }

      return disableConditions
    }, [getCurrentSelection, isCursorBeforeDecimalSeparator, maxDecimals])

    const updateDisabledKeys = useCallback(
      (value: string): void => {
        setDisabledKeys((prevDisabledKeys) => {
          let isUpdated = false
          const newDisabledKeys = Object.fromEntries(
            // oxlint-disable-next-line max-nested-callbacks
            Object.entries(disableKeysConditions).map(([key, condition]): [string, boolean] => {
              const isDisabled = condition(value)
              if (isDisabled !== prevDisabledKeys[key as KeyLabel]) {
                isUpdated = true
              }
              return [key, isDisabled]
            }),
          )
          // Prevent unnecessary re-renders and return the same value
          // if no key was updated (react state won't be updated if value is the
          // same as the previous one in terms of referential equality)
          // oxlint-disable-next-line typescript/no-unnecessary-condition
          return isUpdated ? newDisabledKeys : prevDisabledKeys
        })
      },
      [disableKeysConditions],
    )

    const updateValue = useCallback(
      (newValue: string): void => {
        if (isNumeric(newValue, true) && !isSafeNumber(newValue)) {
          return
        }

        setValue(newValue)
        updateDisabledKeys(newValue)
      },
      [setValue, updateDisabledKeys],
    )

    // TODO(MOB-140): in USD mode, prevent user from typing in more than 2 decimals
    const handleInsert = useCallback(
      (label: KeyLabel): void => {
        const { start, end } = getCurrentSelection()
        const previousValue = valueRef.current

        if (start === undefined || end === undefined) {
          // has no text selection, cursor is at the end of the text input
          const newValue = valueRef.current + label
          resetSelection({ start: newValue.length, end: newValue.length, value: newValue })
          updateValue(newValue)
        } else {
          const newValue = valueRef.current.slice(0, start) + label + valueRef.current.slice(end)
          resetSelection({ start: start + 1, end: start + 1, value: newValue })
          updateValue(newValue)
        }

        // If the value wasn't updated (e.g., rejected by the consumer because it exceeds
        // the safe number range), restore the cursor to its previous position.
        if (valueRef.current === previousValue) {
          if (start === undefined || end === undefined) {
            resetSelection({ start: previousValue.length, end: previousValue.length, value: previousValue })
          } else {
            resetSelection({ start, end, value: previousValue })
          }
        }
      },
      [updateValue, resetSelection, valueRef, getCurrentSelection],
    )

    const handleDelete = useCallback((): void => {
      // oxlint-disable-next-line max-params
      const isEntireTextSelected = (start: number, end: number, value: string): boolean =>
        start === 0 && end === value.length

      const { start, end } = getCurrentSelection()
      const currentValue = valueRef.current

      if (start === undefined || end === undefined) {
        // has no text selection, cursor is at the end of the text input
        const newValue = currentValue.slice(0, -1)
        resetSelection({ start: newValue.length, end: newValue.length, value: newValue })
        updateValue(newValue)
      } else if (isEntireTextSelected(start, end, currentValue)) {
        // entire text is selected, clear the input
        resetSelection({ start: 0, end: 0, value: '' })
        updateValue('')
      } else if (start < end) {
        // has text part selected
        const newValue = currentValue.slice(0, start) + currentValue.slice(end)
        resetSelection({ start, end: start, value: newValue })
        updateValue(newValue)
      } else if (start > 0) {
        // part of the text is not selected, but cursor moved
        const newValue = currentValue.slice(0, start - 1) + currentValue.slice(start)
        resetSelection({ start: start - 1, end: start - 1, value: newValue })
        updateValue(newValue)
      }
    }, [updateValue, resetSelection, valueRef, getCurrentSelection])

    const onPress = useCallback(
      (label: KeyLabel, action: KeyAction) => {
        if (disabled) {
          return
        }
        if (action === KeyAction.Insert) {
          handleInsert(label)
        } else {
          handleDelete()
        }
      },
      [disabled, handleInsert, handleDelete],
    )

    const deletingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const stopDeleting = useCallback(() => clearTimeout(deletingTimeout.current), [])

    const onLongPressStart = useCallback(
      (_: KeyLabel, action: KeyAction) => {
        if (disabled || action !== KeyAction.Delete) {
          return
        }

        // We delete one character at a time until we've deleted either half of the input text or more than 5 characters,
        // and then we start deleting by "word" (ie. up until the next decimal or thousand separator).

        const initialAmountLength = valueRef.current.length

        const deleteWithTimeout = (): void => {
          const start = getCurrentSelection().start ?? valueRef.current.length
          const isCursorAtTheEnd = start === valueRef.current.length

          const hasDeletedMoreThanHalfCharacters = valueRef.current.length <= initialAmountLength / 2
          const hasDeletedMoreThanFiveCharacters = initialAmountLength - valueRef.current.length >= 5

          // If we haven't deleted more than half of the input or more than 5 characters, we delete one character at a time.
          if (!isCursorAtTheEnd || !(hasDeletedMoreThanHalfCharacters || hasDeletedMoreThanFiveCharacters)) {
            handleDelete()
            deletingTimeout.current = setTimeout(deleteWithTimeout, LONG_PRESS_DELETE_INTERVAL_MS)
            return
          }

          const nextDelimiterPosition = Math.max(
            valueRef.current.lastIndexOf('.'),
            valueRef.current.lastIndexOf(','),
            valueRef.current.lastIndexOf(' '),
          )

          // If we found a thousand or decimal separator, we delete up until that delimiter.
          if (nextDelimiterPosition > 0) {
            const newValue = valueRef.current.slice(0, nextDelimiterPosition)
            resetSelection({ start: nextDelimiterPosition, end: nextDelimiterPosition, value: newValue })
            updateValue(newValue)

            // When we delete by delimiter, we want to have a slightly longer delay so the user has enough time to stop long pressing.
            deletingTimeout.current = setTimeout(deleteWithTimeout, LONG_PRESS_DELETE_INTERVAL_DELIMITER_MS)
            return
          }

          // If we've already deleted more than half of the input and there are no more delimiters to delete by, we delete everything.
          resetSelection({ start: 0, end: 0, value: '' })
          updateValue('')
          return
        }

        deleteWithTimeout()
      },
      [disabled, getCurrentSelection, handleDelete, resetSelection, updateValue, valueRef],
    )

    const onLongPressEnd = useCallback(
      (_: KeyLabel, action: KeyAction) => {
        if (disabled || action !== KeyAction.Delete) {
          return
        }
        stopDeleting()
      },
      [disabled, stopDeleting],
    )

    useEffect(() => {
      // Clear the interval when the component unmounts.
      // This shouldn't be necessary, but it's a good practice to avoid potential issues with `onLongPressEnd` not firing in some unknown edge case.
      return () => stopDeleting()
    }, [stopDeleting])

    return (
      <DecimalPad
        disabled={disabled}
        disabledKeys={disabledKeys}
        hideDecimal={hideDecimal}
        maxHeight={maxHeight}
        onKeyLongPressStart={onLongPressStart}
        onKeyLongPressEnd={onLongPressEnd}
        onKeyPress={onPress}
        onReady={onReady}
        onTriggerInputShakeAnimation={onTriggerInputShakeAnimation}
      />
    )
  }),
)
