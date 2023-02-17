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
      <Flex row gap="spacing8">
        <Box
          alignItems="center"
          backgroundColor={checked ? 'accentAction' : 'background1'}
          borderColor={checked ? 'accentAction' : 'backgroundOutline'}
          borderRadius="rounded4"
          borderWidth={1.5}
          height={theme.iconSizes.icon20}
          justifyContent="center"
          mt="spacing2"
          p="spacing2"
          width={theme.iconSizes.icon20}>
          {checked ? (
            <Check
              color={theme.colors.white}
              height={theme.iconSizes.icon16}
              width={theme.iconSizes.icon16}
            />
          ) : null}
        </Box>
        <Box flexShrink={1}>
          <Text variant="subheadSmall">{text}</Text>
        </Box>
      </Flex>
    </TouchableArea>
  )
}
