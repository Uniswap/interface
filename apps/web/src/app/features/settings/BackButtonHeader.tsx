import { useNavigate } from 'react-router-dom'
import { Text, XStack } from 'ui'
import Chevron from 'ui/assets/icons/chevron-left.svg'
import { Flex } from 'ui/components/layout/Flex'
import { iconSizes } from 'ui/theme/iconSizes'

type Props = {
  headerText: string
}

/**
 * Header with a back button and center text used for settings screens
 */
export function BackButtonHeader({ headerText }: Props): JSX.Element {
  const navigate = useNavigate()
  const onBackButtonPressed = (): void => {
    navigate(-1)
  }

  return (
    <XStack alignItems="center" justifyContent="space-between" paddingVertical="$spacing12">
      <Flex onPress={onBackButtonPressed}>
        <Chevron height={iconSizes.icon24} width={iconSizes.icon24} />
      </Flex>
      <Text variant="bodyLarge">{headerText}</Text>
      <Flex height={iconSizes.icon24} width={iconSizes.icon24} /> {/* Spacer */}
    </XStack>
  )
}
