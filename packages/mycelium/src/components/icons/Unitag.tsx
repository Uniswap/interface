import { memo } from 'react'
import type { ReactElement } from 'react'
import { ICON_SIZE_TOKEN_PX, lookupToken } from '../../compat/tokens'
import { UnitagImage } from './internal/unitag-image'

/** Accepts a px number or an `$icon.N` size token, like the generated icons. */
function UnitagIcon({ size = 24 }: { size?: number | string }): ReactElement {
  const resolvedSize = typeof size === 'string' ? (lookupToken(ICON_SIZE_TOKEN_PX, size) ?? size) : size
  return <UnitagImage size={resolvedSize} />
}

export const Unitag = memo(UnitagIcon)
