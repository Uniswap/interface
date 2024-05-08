import React from 'react'
import { SvgProps } from 'react-native-svg'
import { useAppDispatch } from 'src/app/hooks'
import Trace from 'src/components/Trace/Trace'
import { Flex, IconProps, Text, TouchableArea, useSporeColors } from 'ui/src'
import CopyIcon from 'ui/src/assets/icons/copy-sheets.svg'
import { iconSizes } from 'ui/src/theme'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { ElementNameType } from 'wallet/src/telemetry/constants'
import { setClipboard } from 'wallet/src/utils/clipboard'
import { openUri } from 'wallet/src/utils/linking'

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
  Icon?: React.FC<SvgProps & { size?: IconProps['size'] }>
  element: ElementNameType
  openExternalBrowser?: boolean
  isSafeUri?: boolean
  value: string
}): JSX.Element {
  const dispatch = useAppDispatch()
  const colors = useSporeColors()

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
        backgroundColor="$surface2"
        borderRadius="$rounded20"
        px="$spacing12"
        py="$spacing8"
        testID={element}
        onPress={onPress}>
        <Flex centered row shrink gap="$spacing8" width="auto">
          {Icon && <Icon color={colors.neutral1.get()} size="$icon.16" />}
          <Text $short={{ variant: 'buttonLabel4' }} color="$neutral1" variant="buttonLabel3">
            {label}
          </Text>
          {buttonType === LinkButtonType.Copy && (
            <CopyIcon
              color={colors.neutral2.get()}
              height={iconSizes.icon16}
              width={iconSizes.icon16}
            />
          )}
        </Flex>
      </TouchableArea>
    </Trace>
  )
}
