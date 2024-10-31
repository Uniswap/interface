import {
  RefObject,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Flex } from 'ui/src'
import { TextInputProps } from 'uniswap/src/components/input/TextInput'
import { DecimalPad } from 'uniswap/src/features/transactions/DecimalPadInput/DecimalPad'
// eslint-disable-next-line no-restricted-imports -- type import is safe
import type { LayoutChangeEvent } from 'react-native'
import { KeyAction, KeyLabel } from 'uniswap/src/features/transactions/DecimalPadInput/types'
import { maxDecimalsReached } from 'utilities/src/format/truncateToMaxDecimals'

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

/*
This component is used to calculate the space that the `DecimalPad` can use.
We position the `DecimalPad` with `position: absolute` at the bottom of the screen instead of
putting it inside this container in order to avoid any overflows while the `DecimalPad`
is automatically resizing to find the right size for the screen.
*/
export function DecimalPadCalculateSpace({
  isShortMobileDevice,
  decimalPadRef,
}: {
  isShortMobileDevice: boolean
  decimalPadRef: RefObject<DecimalPadInputRef>
}): JSX.Element {
  const onBottomScreenLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      decimalPadRef.current?.setMaxHeight(event.nativeEvent.layout.height)
    },
    [decimalPadRef],
  )

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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [valueRef, selectionRef])

    useImperativeHandle(ref, () => ({
      updateDisabledKeys(): void {
        updateDisabledKeys(valueRef.current)
      },
      setMaxHeight(height: number): void {
        setMaxHeight(height)
      },
    }))

    const getCurrentSelection = useCallback(() => {
      const selection = selectionRef?.current
      return { start: selection?.start, end: selection?.end }
    }, [selectionRef])

    const disableKeysConditions = useMemo<Partial<Record<KeyLabel, DisableKeyCondition>>>(
      () => ({
        '0': (v) => maxDecimalsReached({ value: v, maxDecimals }),
        '1': (v) => maxDecimalsReached({ value: v, maxDecimals }),
        '2': (v) => maxDecimalsReached({ value: v, maxDecimals }),
        '3': (v) => maxDecimalsReached({ value: v, maxDecimals }),
        '4': (v) => maxDecimalsReached({ value: v, maxDecimals }),
        '5': (v) => maxDecimalsReached({ value: v, maxDecimals }),
        '6': (v) => maxDecimalsReached({ value: v, maxDecimals }),
        '7': (v) => maxDecimalsReached({ value: v, maxDecimals }),
        '8': (v) => maxDecimalsReached({ value: v, maxDecimals }),
        '9': (v) => maxDecimalsReached({ value: v, maxDecimals }),
        '.': (v) => v.includes('.'),
        backspace: (v): boolean => {
          const { start, end } = getCurrentSelection()
          const cursorAtStart = start === 0 && end === 0
          return cursorAtStart || v.length === 0
        },
      }),
      [getCurrentSelection, maxDecimals],
    )

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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
      const { start, end } = getCurrentSelection()
      if (start === undefined || end === undefined) {
        resetSelection({ start: valueRef.current.length - 1, end: valueRef.current.length - 1 })
        // has no text selection, cursor is at the end of the text input
        updateValue(valueRef.current.slice(0, -1))
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
