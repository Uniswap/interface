import { useResponsiveProp } from '@shopify/restyle'
import React from 'react'
import { SvgProps } from 'react-native-svg'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Flex } from 'src/components/layout'
import { Trace } from 'src/components/telemetry/Trace'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'
import { setClipboard } from 'src/utils/clipboard'
import { openUri } from 'src/utils/linking'
import CopyIcon from 'ui/src/assets/icons/copy-sheets.svg'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'

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

  const copyValue = async (): Promise<void> => {
    await setClipboard(value)
    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.Address,
      })
    )
  }

  const onPress = async (): Promise<void> => {
    if (buttonType === LinkButtonType.Link) {
      await openUri(value, openExternalBrowser, isSafeUri)
    } else {
      await copyValue()
    }
  }

  return (
    <Trace logPress element={element}>
      <TouchableArea
        hapticFeedback
        backgroundColor="background2"
        borderRadius="rounded20"
        paddingHorizontal="spacing12"
        paddingVertical="spacing8"
        testID={element}
        onPress={onPress}>
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
    </Trace>
  )
}
