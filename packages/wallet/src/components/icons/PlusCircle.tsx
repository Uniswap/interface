import { Flex, useIsDarkMode } from 'ui/src'
import { Plus } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'

export function PlusCircle(): JSX.Element {
  const isDarkMode = useIsDarkMode()

  return (
    <Flex
      centered
      backgroundColor="$surface1"
      borderColor="$surface3"
      borderRadius="$roundedFull"
      borderWidth="$spacing1"
      height={iconSizes.icon32}
      p="$spacing8"
      shadowColor={isDarkMode ? '$shadowColor' : '$surface3'}
      shadowOffset={{ width: 0, height: 0 }}
      shadowRadius={10}
      width={iconSizes.icon32}
    >
      <Plus color="$neutral2" size="$icon.16" strokeWidth={2} />
    </Flex>
  )
}
