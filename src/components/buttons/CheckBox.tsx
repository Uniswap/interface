import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import Check from 'src/assets/icons/check.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'

export type CheckBoxProps = {
  checked: boolean
  text?: string
  onCheckPressed?: (currentState: boolean) => void
}

export function CheckBox({ text, checked, onCheckPressed }: CheckBoxProps): JSX.Element {
  const theme = useAppTheme()

  const onPress = (): void => {
    onCheckPressed?.(checked)
  }

  return (
    <TouchableArea onPress={onPress}>
      <Flex row gap="xs">
        <Box
          alignItems="center"
          backgroundColor={checked ? 'accentAction' : 'background1'}
          borderColor={checked ? 'accentAction' : 'backgroundOutline'}
          borderRadius="xs"
          borderWidth={1.5}
          height={theme.iconSizes.md}
          justifyContent="center"
          mt="xxxs"
          p="xxxs"
          width={theme.iconSizes.md}>
          {checked ? (
            <Check
              color={theme.colors.white}
              height={theme.iconSizes.sm}
              width={theme.iconSizes.sm}
            />
          ) : null}
        </Box>
        <Box flexShrink={1}>
          <Text variant="buttonLabelMicro">{text}</Text>
        </Box>
      </Flex>
    </TouchableArea>
  )
}
