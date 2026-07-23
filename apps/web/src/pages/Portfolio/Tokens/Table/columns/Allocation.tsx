import { memo } from 'react'
import { Flex, Progress } from 'ui/src'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

export const Allocation = memo(function Allocation({ value }: { value: number }): JSX.Element {
  const { formatPercent } = useLocalizationContext()

  return (
    <Flex row alignItems="center" gap="$spacing8">
      <AnimatedNumber shouldFadeDecimals value={formatPercent(value, 1)} numericValue={value} textVariant="$body3" />
      <Flex width={52} height="$spacing8" borderRadius="$roundedFull" backgroundColor="$surface3">
        <Progress height="$spacing4" margin="$spacing2" backgroundColor="$transparent" value={Math.round(value)}>
          <Progress.Indicator backgroundColor="$neutral1" borderRadius="$roundedFull" animation="quick" />
        </Progress>
      </Flex>
    </Flex>
  )
})
Allocation.displayName = 'Allocation'
