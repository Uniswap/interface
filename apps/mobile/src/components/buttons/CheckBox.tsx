import React from 'react'
import { Flex, Icons, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'

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
      <Flex row gap="$spacing12">
        <Flex
          alignItems="center"
          backgroundColor={checked ? '$neutral1' : '$surface2'}
          borderColor={checked ? '$neutral1' : '$neutral3'}
          borderRadius="$roundedFull"
          borderWidth={1.5}
          height={iconSizes.icon24}
          justifyContent="center"
          mt="$spacing4"
          p="$spacing2"
          width={iconSizes.icon24}>
          {checked ? (
            <Icons.Check color={isDarkMode ? '$sporeBlack' : '$sporeWhite'} size="$icon.16" />
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
