import type { IconProps } from '@tamagui/helpers-icon'
import { memo } from 'react'
import { Platform } from 'react-native'
import * as Icons from 'ui/src/components/icons/allIcons'

function _OSDynamicCloudIcon(iconProps: IconProps): JSX.Element {
  if (Platform.OS === 'ios') {
    return <Icons.Cloud {...iconProps} />
  } else {
    return <Icons.GoogleDrive {...iconProps} />
  }
}

export const OSDynamicCloudIcon = memo(_OSDynamicCloudIcon)
