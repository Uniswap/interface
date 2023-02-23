import { useResponsiveProp } from '@shopify/restyle'
import { SharedEventName } from '@uniswap/analytics-events'
import React from 'react'
import { SvgProps } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import { sendAnalyticsEvent } from 'src/features/telemetry'
import { ElementName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { openUri } from 'src/utils/linking'
import { TouchableArea } from '../buttons/TouchableArea'
import { Flex } from '../layout'
import { Text } from '../Text'

export function LinkButtonWithIcon({
  label,
  Icon,
  url,
  element,
  openExternalBrowser = false,
  isSafeUri = false,
}: {
  label: string
  Icon: React.FC<SvgProps>
  url: string
  element: ElementName
  openExternalBrowser?: boolean
  isSafeUri?: boolean
}): JSX.Element {
  const theme = useAppTheme()

  const fontSize = useResponsiveProp({
    xs: 'buttonLabelMicro',
    sm: 'buttonLabelSmall',
  })

  return (
    <TouchableArea
      hapticFeedback
      backgroundColor="background2"
      borderRadius="rounded20"
      paddingHorizontal="spacing12"
      paddingVertical="spacing8"
      onPress={(): void => {
        sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
          element,
          screen: Screens.TokenDetails,
        })
        openUri(url, openExternalBrowser, isSafeUri)
        return
      }}>
      <Flex centered row gap="spacing8">
        <Icon
          color={theme.colors.textPrimary}
          height={theme.iconSizes.icon16}
          width={theme.iconSizes.icon16}
        />
        <Text color="textPrimary" variant={fontSize}>
          {label}
        </Text>
      </Flex>
    </TouchableArea>
  )
}
