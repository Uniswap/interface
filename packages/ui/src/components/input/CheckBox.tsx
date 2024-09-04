import { ColorTokens } from 'tamagui'
import { Check } from 'ui/src/components/icons'
import { Flex } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text'
import { TouchableArea } from 'ui/src/components/touchable'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'
import { iconSizes } from 'ui/src/theme'

export type CheckBoxProps = {
  checked: boolean
  text?: string | JSX.Element
  checkedColor?: ColorTokens
  onCheckPressed?: (currentState: boolean) => void
}

export function CheckBox({ text, checked, checkedColor = '$neutral1', onCheckPressed }: CheckBoxProps): JSX.Element {
  const isDarkMode = useIsDarkMode()

  const onPress = (): void => {
    onCheckPressed?.(checked)
  }

  return (
    <TouchableArea onPress={onPress}>
      <Flex row gap="$spacing12" px="$spacing4">
        <Flex
          alignItems="center"
          backgroundColor={checked ? checkedColor : '$surface1'}
          borderColor={checked ? checkedColor : '$neutral3'}
          borderRadius="$rounded4"
          borderWidth={1.5}
          height={iconSizes.icon20}
          justifyContent="center"
          mt="$spacing4"
          p="$spacing2"
          width={iconSizes.icon20}
        >
          {checked ? <Check color={isDarkMode ? '$black' : '$white'} size="$icon.16" /> : null}
        </Flex>
        {text && (
          <Flex shrink>
            {typeof text === 'string' ? (
              <Text $short={{ variant: 'buttonLabel3' }} variant="subheading2">
                {text}
              </Text>
            ) : (
              text
            )}
          </Flex>
        )}
      </Flex>
    </TouchableArea>
  )
}
