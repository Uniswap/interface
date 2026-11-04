/** Native leg of the Unitag badge image: the full-size assets through UniversalImage, following the app theme. */
import { useMemo } from 'react'
import type { ReactElement } from 'react'
import { UNITAG_DARK, UNITAG_LIGHT } from '../../../assets'
import { useIsDarkMode } from '../../../theme-hooks-compat/useIsDarkMode'
import { UniversalImage } from '../../../universal-image'

export function UnitagImage({ size }: { size: number | string }): ReactElement {
  const isDarkMode = useIsDarkMode()
  const px = Number(size)
  const imageSize = useMemo(() => ({ height: px, width: px }), [px])

  return <UniversalImage allowLocalUri size={imageSize} uri={isDarkMode ? UNITAG_DARK : UNITAG_LIGHT} />
}
