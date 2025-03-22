import { easeInEaseOutLayoutAnimation } from 'ui/src/animations/layout/layoutAnimation'
import { useHasValueChanged } from 'utilities/src/react/useHasValueChanged'

export function useLayoutAnimationOnChange<ValueType>(
  value: ValueType,
  options?: Parameters<typeof easeInEaseOutLayoutAnimation>[0],
): undefined {
  const hasValueChanged = useHasValueChanged(value)

  if (hasValueChanged) {
    easeInEaseOutLayoutAnimation(options)
  }
}
