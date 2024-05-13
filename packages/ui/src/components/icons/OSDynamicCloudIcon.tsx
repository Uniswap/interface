import { memo } from 'react'
import { Platform } from 'react-native'
import { IconProps } from 'ui/src/components/factories/createIcon'
import { Cloud, GoogleDrive } from 'ui/src/components/icons'

function _OSDynamicCloudIcon(iconProps: IconProps): JSX.Element {
  if (Platform.OS === 'ios') {
    return <Cloud {...iconProps} />
  } else {
    return <GoogleDrive {...iconProps} />
  }
}

export const OSDynamicCloudIcon = memo(_OSDynamicCloudIcon)
