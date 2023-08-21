import { useResponsiveProp } from '@shopify/restyle'
import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { useIsDarkMode } from 'src/features/appearance/hooks'
import Check from 'ui/src/assets/icons/check.svg'

export type CheckBoxProps = {
  checked: boolean
  text?: string | JSX.Element
  onCheckPressed?: (currentState: boolean) => void
}

export function CheckBox({ text, checked, onCheckPressed }: CheckBoxProps): JSX.Element {
  const theme = useAppTheme()
  const isDarkMode = useIsDarkMode()

  const onPress = (): void => {
    onCheckPressed?.(checked)
  }

  const fontSize = useResponsiveProp({
    xs: 'buttonLabelMicro',
    sm: 'subheadSmall',
  })

  return (
    <TouchableArea onPress={onPress}>
      <Flex row gap="spacing12">
        <Box
          alignItems="center"
          backgroundColor={checked ? 'neutral1' : 'surface2'}
          borderColor={checked ? 'neutral1' : 'neutral3'}
          borderRadius="roundedFull"
          borderWidth={1.5}
          height={theme.iconSizes.icon24}
          justifyContent="center"
          mt="spacing4"
          p="spacing2"
          width={theme.iconSizes.icon24}>
          {checked ? (
            <Check
              color={isDarkMode ? theme.colors.sporeBlack : theme.colors.sporeWhite}
              height={theme.iconSizes.icon16}
              width={theme.iconSizes.icon16}
            />
          ) : null}
        </Box>
        <Box flexShrink={1}>
          {typeof text === 'string' ? <Text variant={fontSize}>{text}</Text> : text}
        </Box>
      </Flex>
    </TouchableArea>
  )
}
