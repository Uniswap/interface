import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TextInputProps } from 'src/components/input/TextInput'
import { DecimalPad, KeyAction, KeyLabel } from 'src/features/transactions/swapRewrite/DecimalPad'

type DecimalPadInputProps = {
  valueRef: React.MutableRefObject<string>
  selectionRef?: React.MutableRefObject<TextInputProps['selection']>
  disabled?: boolean
  hideDecimal?: boolean
  hasCurrencyPrefix?: boolean
  setValue: (newValue: string) => void
  resetSelection?: (start: number, end?: number) => void
}

export const DecimalPadInput = memo(function DecimalPadInput({
  valueRef,
  selectionRef,
  setValue,
  resetSelection,
  hasCurrencyPrefix,
  hideDecimal,
  disabled,
}: DecimalPadInputProps): JSX.Element {
  const hasPrefixRef = useRef(false)
  const prefixLengthRef = useRef(0)
  const cursorAtStartRef = useRef(false)
  const [disabledKeys, setDisabledKeys] = useState<Partial<Record<KeyLabel, boolean>>>({})

  const disableKeysConditions = useMemo<Partial<Record<KeyLabel, (value: string) => boolean>>>(
    () => ({
      '.': (v) => v.includes('.'),
      '←': (v) => cursorAtStartRef.current || v.length === 0,
    }),
    []
  )

  const getCurrentSelection = useCallback(() => {
    const hasPrefix = hasPrefixRef.current
    const selection = selectionRef?.current
    const start =
      selection && selection.start > 0 && hasPrefix ? selection.start - 1 : selection?.start
    const end = selection?.end && hasPrefix ? selection.end - 1 : selection?.end
    return { start, end }
  }, [hasPrefixRef, selectionRef])

  useEffect(() => {
    const { start, end } = getCurrentSelection()
    hasPrefixRef.current = !!hasCurrencyPrefix
    prefixLengthRef.current = hasCurrencyPrefix ? 1 : 0
    cursorAtStartRef.current = hasPrefixRef.current
      ? start === 1 && end === 1
      : start === 0 && end === 0
  }, [hasCurrencyPrefix, getCurrentSelection])

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
          })
        )
        // Prevent unnecessary re-renders and return the same value
        // if no key was updated (react state won't be updated if value is the
        // same as the previous one in terms of referential equality)
        return isUpdated ? newDisabledKeys : prevDisabledKeys
      })
    },
    [disableKeysConditions]
  )

  const updateValue = useCallback(
    (newValue: string): void => {
      setValue(newValue)
      updateDisabledKeys(newValue)
    },
    [setValue, updateDisabledKeys]
  )

  // TODO(MOB-140): in USD mode, prevent user from typing in more than 2 decimals
  const handleInsert = useCallback(
    (label: KeyLabel): void => {
      const { start, end } = getCurrentSelection()
      const prefixLength = prefixLengthRef.current
      if (start === undefined || end === undefined) {
        // has no text selection, cursor is at the end of the text input
        updateValue(valueRef.current + label)
        resetSelection?.(valueRef.current.length + 1, valueRef.current.length + 1)
      } else {
        updateValue(valueRef.current.slice(0, start) + label + valueRef.current.slice(end))
        resetSelection?.(start + 1 + prefixLength, start + 1 + prefixLength)
      }
    },
    [updateValue, resetSelection, valueRef, getCurrentSelection, prefixLengthRef]
  )

  const handleDelete = useCallback((): void => {
    const { start, end } = getCurrentSelection()
    const prefixLength = prefixLengthRef.current
    if (start === undefined || end === undefined) {
      // has no text selection, cursor is at the end of the text input
      updateValue(valueRef.current.slice(0, -1))
      resetSelection?.(valueRef.current.length - 1, valueRef.current.length - 1)
    } else if (start < end) {
      // has text part selected
      updateValue(valueRef.current.slice(0, start) + valueRef.current.slice(end))
      resetSelection?.(start + prefixLength, start + prefixLength)
    } else if (start > 0) {
      // part of the text is not selected, but cursor moved
      updateValue(valueRef.current.slice(0, start - 1) + valueRef.current.slice(start))
      resetSelection?.(start - 1 + prefixLength, start - 1 + prefixLength)
    }
  }, [updateValue, resetSelection, valueRef, getCurrentSelection, prefixLengthRef])

  const onPress = useCallback(
    (label: KeyLabel, action: KeyAction) => {
      if (disabled) return
      if (action === KeyAction.Insert) {
        handleInsert(label)
      } else {
        handleDelete()
      }
    },
    [disabled, handleInsert, handleDelete]
  )

  const onLongPress = useCallback(
    (_: KeyLabel, action: KeyAction) => {
      if (disabled || action !== KeyAction.Delete) return
      setValue('')
      resetSelection?.(0, 0)
    },
    [disabled, setValue, resetSelection]
  )

  return (
    <DecimalPad
      disabled={disabled}
      disabledKeys={disabledKeys}
      hideDecimal={hideDecimal}
      onKeyLongPress={onLongPress}
      onKeyPress={onPress}
    />
  )
})
