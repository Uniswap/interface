import { Check } from 'ui/src/components/icons'
import { Flex } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text'
import { TouchableArea } from 'ui/src/components/touchable'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'
import { iconSizes } from 'ui/src/theme'

export type CheckBoxProps = {
  checked: boolean
  text?: string | JSX.Element
  onCheckPressed?: (currentState: boolean) => void
}

export function CheckBox({ text, checked, onCheckPressed }: CheckBoxProps): JSX.Element {
  const isDarkMode = useIsDarkMode()

  const onPress = (): void => {
    onCheckPressed?.(checked)
  }

  return (
    <TouchableArea onPress={onPress}>
      <Flex row gap="$spacing12" px="$spacing4">
        <Flex
          alignItems="center"
          backgroundColor={checked ? '$neutral1' : '$surface1'}
          borderColor={checked ? '$neutral1' : '$neutral3'}
          borderRadius="$roundedFull"
          borderWidth={1.5}
          height={iconSizes.icon20}
          justifyContent="center"
          mt="$spacing4"
          p="$spacing2"
          width={iconSizes.icon20}>
          {checked ? (
            <Check color={isDarkMode ? '$sporeBlack' : '$sporeWhite'} size="$icon.16" />
          ) : null}
        </Flex>
        <Flex shrink>
          {typeof text === 'string' ? (
            <Text $short={{ variant: 'buttonLabel4' }} variant="subheading2">
              {text}
            </Text>
          ) : (
            text
          )}
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
