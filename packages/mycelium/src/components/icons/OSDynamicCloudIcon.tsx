import { memo } from 'react'
import type { ReactElement } from 'react'
import type { GeneratedIconProps } from '../factories/createIcon'
import { GoogleDrive } from './GoogleDrive'

// Mycelium is web-only; the legacy component renders GoogleDrive on every
// platform except iOS, so the web port is a GoogleDrive passthrough.
function _OSDynamicCloudIcon(iconProps: GeneratedIconProps): ReactElement {
  return <GoogleDrive {...iconProps} />
}

export const OSDynamicCloudIcon = memo(_OSDynamicCloudIcon)
