import React from 'react'
import { SvgProps } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import { openUri } from 'src/utils/linking'
import { TouchableArea } from '../buttons/TouchableArea'
import { Flex } from '../layout'
import { Text } from '../Text'

export function LinkButtonWithIcon({
  label,
  Icon,
  url,
  openExternalBrowser = false,
  isSafeUri = false,
}: {
  label: string
  Icon: React.FC<SvgProps>
  url: string
  openExternalBrowser?: boolean
  isSafeUri?: boolean
}): JSX.Element {
  const theme = useAppTheme()

  return (
    <TouchableArea
      hapticFeedback
      backgroundColor="background2"
      borderRadius="rounded20"
      paddingHorizontal="spacing12"
      paddingVertical="spacing8"
      onPress={(): Promise<void> => openUri(url, openExternalBrowser, isSafeUri)}>
      <Flex centered row gap="spacing8">
        <Icon
          color={theme.colors.textPrimary}
          height={theme.iconSizes.icon16}
          width={theme.iconSizes.icon16}
        />
        <Text color="textPrimary" variant="buttonLabelMicro">
          {label}
        </Text>
      </Flex>
    </TouchableArea>
  )
}
