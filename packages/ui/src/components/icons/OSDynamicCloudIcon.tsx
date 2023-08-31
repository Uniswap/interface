import type { IconProps } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Platform } from 'react-native'
import { Icons } from 'ui/src'

function _OSDynamicCloudIcon(iconProps: IconProps): JSX.Element {
  if (Platform.OS === 'ios') {
    return <Icons.Cloud {...iconProps} />
  } else {
    return <Icons.GoogleDrive {...iconProps} />
  }
}

export const OSDynamicCloudIcon = memo(_OSDynamicCloudIcon)
