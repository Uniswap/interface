import { memo } from 'react'
import type { ReactElement } from 'react'
import type { GeneratedIconProps } from '../factories/createIcon'
import { OSCloudGlyph } from './internal/os-cloud-glyph'

function _OSDynamicCloudIcon(iconProps: GeneratedIconProps): ReactElement {
  return <OSCloudGlyph {...iconProps} />
}

export const OSDynamicCloudIcon = memo(_OSDynamicCloudIcon)
