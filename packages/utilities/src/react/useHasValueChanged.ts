import { usePreviousWithLayoutEffect } from 'utilities/src/react/usePreviousWithLayoutEffect'

export function useHasValueChanged<ValueType>(value: ValueType): boolean {
  const prevValue = usePreviousWithLayoutEffect(value)

  return prevValue !== value
}
