import { useResponsiveProp } from '@shopify/restyle'
import { SharedEventName } from '@uniswap/analytics-events'
import React from 'react'
import { SvgProps } from 'react-native-svg'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType, CopyNotificationType } from 'src/features/notifications/types'
import { ElementName } from 'src/features/telemetry/constants'
import { setClipboard } from 'src/utils/clipboard'
import { openUri } from 'src/utils/linking'
import CopyIcon from 'ui/src/assets/icons/copy-sheets.svg'

export enum LinkButtonType {
  Copy = 'copy',
  Link = 'link',
}

export function LinkButton({
  buttonType,
  label,
  Icon,
  element,
  openExternalBrowser = false,
  isSafeUri = false,
  value,
}: {
  buttonType: LinkButtonType
  label: string
  Icon?: React.FC<SvgProps>
  element: ElementName
  openExternalBrowser?: boolean
  isSafeUri?: boolean
  value: string
}): JSX.Element {
  const dispatch = useAppDispatch()
  const theme = useAppTheme()

  const fontSize = useResponsiveProp({
    xs: 'buttonLabelMicro',
    sm: 'buttonLabelSmall',
  })

  const copyValue = (): void => {
    setClipboard(value)
    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.Address,
      })
    )
  }

  const openLink = (): void => {
    openUri(value, openExternalBrowser, isSafeUri)
  }

  return (
    <TouchableArea
      hapticFeedback
      backgroundColor="background2"
      borderRadius="rounded20"
      eventName={SharedEventName.ELEMENT_CLICKED}
      name={element}
      paddingHorizontal="spacing12"
      paddingVertical="spacing8"
      onPress={(): void => {
        if (buttonType === LinkButtonType.Link) {
          openLink()
        } else {
          copyValue()
        }
      }}>
      <Flex centered row gap="spacing8">
        {Icon && (
          <Icon
            color={theme.colors.textPrimary}
            height={theme.iconSizes.icon16}
            width={theme.iconSizes.icon16}
          />
        )}
        <Text color="textPrimary" variant={fontSize}>
          {label}
        </Text>
        {buttonType === LinkButtonType.Copy && (
          <CopyIcon
            color={theme.colors.textSecondary}
            height={theme.iconSizes.icon16}
            width={theme.iconSizes.icon16}
          />
        )}
      </Flex>
    </TouchableArea>
  )
}
