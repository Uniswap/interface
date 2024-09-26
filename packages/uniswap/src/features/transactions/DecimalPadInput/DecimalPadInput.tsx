import { RefObject, forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { Flex } from 'ui/src'
import { TextInputProps } from 'uniswap/src/components/input/TextInput'
import { DecimalPad } from 'uniswap/src/features/transactions/DecimalPadInput/DecimalPad'
// eslint-disable-next-line no-restricted-imports -- type import is safe
import type { LayoutChangeEvent } from 'react-native'
import { KeyAction, KeyLabel } from 'uniswap/src/features/transactions/DecimalPadInput/types'
import { maxDecimalsReached } from 'utilities/src/format/truncateToMaxDecimals'

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

    const onLongPress = useCallback(
      (_: KeyLabel, action: KeyAction) => {
        if (disabled || action !== KeyAction.Delete) {
          return
        }
        resetSelection({ start: 0, end: 0 })
        updateValue('')
      },
      [disabled, updateValue, resetSelection],
    )

    return (
      <DecimalPad
        disabled={disabled}
        disabledKeys={disabledKeys}
        hideDecimal={hideDecimal}
        maxHeight={maxHeight}
        onKeyLongPress={onLongPress}
        onKeyPress={onPress}
        onReady={onReady}
        onTriggerInputShakeAnimation={onTriggerInputShakeAnimation}
      />
    )
  }),
)
