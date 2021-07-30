import { useMedia } from 'react-use'
import { MEDIA_WIDTHS } from '../theme'

export const useIsMobileByMedia = () => useMedia(`(max-width: ${MEDIA_WIDTHS['upToMedium']}px)`)
