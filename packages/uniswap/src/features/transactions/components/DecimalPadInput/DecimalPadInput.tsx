import {
  forwardRef,
  memo,
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { Flex, useIsShortMobileDevice } from 'ui/src'
import { TextInputProps } from 'uniswap/src/components/input/TextInput'
import { DecimalPad } from 'uniswap/src/features/transactions/components/DecimalPadInput/DecimalPad'
import { KeyAction, KeyLabel } from 'uniswap/src/features/transactions/components/DecimalPadInput/types'
import { maxDecimalsReached } from 'utilities/src/format/truncateToMaxDecimals'
import { useEvent } from 'utilities/src/react/hooks'

const LONG_PRESS_DELETE_INTERVAL_MS = 20
const LONG_PRESS_DELETE_INTERVAL_DELIMITER_MS = 750

type DisableKeyCondition = (value: string) => boolean

type DecimalPadInputProps = {
  disabled?: boolean
  hideDecimal?: boolean
  onReady: () => void
  resetSelection: (args: { start: number; end?: number }) => void
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
}

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
}: {
  id: DecimalPadCalculatedSpaceId
  decimalPadRef: RefObject<DecimalPadInputRef>
  additionalElementsHeight?: number
}): JSX.Element {
  const isShortMobileDevice = useIsShortMobileDevice()
  const [bottomScreenHeight, setBottomScreenHeight] = useState<number | null>(null)

  const onBottomScreenLayout = useEvent((event: LayoutChangeEvent): void => {
    const height = event.nativeEvent.layout.height
    setBottomScreenHeight(height)
    // We call `setMaxHeight` even if `additionalElementsHeight` is not set yet,
    // because sometimes it won't be set at all if there are no additional elements.
    decimalPadRef.current?.setMaxHeight(height - additionalElementsHeight)
    precalculatedSpace[id] = height
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: we only want to run it when additionalElementsHeight is changed
  useEffect(() => {
    if (!bottomScreenHeight) {
      // There can be a race condition where either `bottomScreenHeight` or `additionalElementsHeight`
      // could be ready first. If `bottomScreenHeight` is not ready yet, we skip this and
      // then `setMaxHeight` will be called from within `onBottomScreenLayout`.
      return
    }
    decimalPadRef.current?.setMaxHeight(bottomScreenHeight - additionalElementsHeight)
  }, [additionalElementsHeight])

  useEffect(() => {
    const precalculatedHeight = precalculatedSpace[id]

    if (precalculatedHeight) {
      // If we have already rendered this screen, we already know how much space this phone has,
      // so we optimistically set the height instead of waiting for the layout event.
      // This improves the perceived loading time of the `DecimalPad`,
      // given that it fades in only after the height is known.
      decimalPadRef.current?.setMaxHeight(precalculatedHeight)
    }
  }, [decimalPadRef, id])

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

    // biome-ignore lint/correctness/useExhaustiveDependencies: -updateDisabledKeys, +selectionRef,maxDecimals
    useEffect(() => {
      updateDisabledKeys(valueRef.current)
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
            Object.entries(disableKeysConditions).map(([key, condition]) => {
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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unnecessary-condition
          return isUpdated ? newDisabledKeys : prevDisabledKeys
        })
      },
      [disableKeysConditions],
    )

    const updateValue = useCallback(
      (newValue: string): void => {
        setValue(newValue)
        updateDisabledKeys(newValue)
      },
      [setValue, updateDisabledKeys],
    )

    // TODO(MOB-140): in USD mode, prevent user from typing in more than 2 decimals
    const handleInsert = useCallback(
      (label: KeyLabel): void => {
        const { start, end } = getCurrentSelection()
        if (start === undefined || end === undefined) {
          resetSelection({ start: valueRef.current.length + 1, end: valueRef.current.length + 1 })
          // has no text selection, cursor is at the end of the text input
          updateValue(valueRef.current + label)
        } else {
          resetSelection({ start: start + 1, end: start + 1 })
          updateValue(valueRef.current.slice(0, start) + label + valueRef.current.slice(end))
        }
      },
      [updateValue, resetSelection, valueRef, getCurrentSelection],
    )

    const handleDelete = useCallback((): void => {
      // eslint-disable-next-line max-params
      const isEntireTextSelected = (start: number, end: number, value: string): boolean =>
        start === 0 && end === value.length

      const { start, end } = getCurrentSelection()
      const currentValue = valueRef.current

      if (start === undefined || end === undefined) {
        resetSelection({ start: valueRef.current.length - 1, end: valueRef.current.length - 1 })
        // has no text selection, cursor is at the end of the text input
        updateValue(valueRef.current.slice(0, -1))
      } else if (isEntireTextSelected(start, end, currentValue)) {
        resetSelection({ start: 0, end: 0 })
        // entire text is selected, clear the input
        updateValue('')
      } else if (start < end) {
        resetSelection({ start, end: start })
        // has text part selected
        updateValue(valueRef.current.slice(0, start) + valueRef.current.slice(end))
      } else if (start > 0) {
        resetSelection({ start: start - 1, end: start - 1 })
        // part of the text is not selected, but cursor moved
        updateValue(valueRef.current.slice(0, start - 1) + valueRef.current.slice(start))
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
            resetSelection({ start: nextDelimiterPosition, end: nextDelimiterPosition })
            updateValue(valueRef.current.slice(0, nextDelimiterPosition))

            // When we delete by delimiter, we want to have a slightly longer delay so the user has enough time to stop long pressing.
            deletingTimeout.current = setTimeout(deleteWithTimeout, LONG_PRESS_DELETE_INTERVAL_DELIMITER_MS)
            return
          }

          // If we've already deleted more than half of the input and there are no more delimiters to delete by, we delete everything.
          resetSelection({ start: 0, end: 0 })
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
