import { memo } from 'react'
import { FlexLoader, Shine } from 'ui/src'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'

export const StatValue = memo(function StatValueInner({
  isLoading,
  numericValue,
  formattedValue,
  disableAnimations,
}: {
  isLoading: boolean
  numericValue: number | undefined
  formattedValue: string
  disableAnimations: boolean
}): JSX.Element {
  if (isLoading) {
    return (
      <Shine>
        <FlexLoader height={16} width={56} borderRadius="$rounded4" />
      </Shine>
    )
  }
  return (
    <AnimatedNumber
      alignRight
      numericValue={numericValue}
      value={formattedValue}
      textVariant="$body2"
      disableAnimations={disableAnimations}
    />
  )
})
