import type { JSX } from 'react'
import { FlexCompat } from '../../flex-compat/FlexCompat'
import type { RequireImageProps } from '../types'

// Web bundlers resolve asset require() calls to url strings rather than numeric ids, so this
// leg is effectively unreachable outside native. The legacy react-native-web Image painted an
// unregistered numeric source as an empty box, which is exactly what this renders (mycelium
// web legs must not import react-native). No load is performed, so the error path (fallback +
// onError, accepted for prop-surface parity with the native leg) cannot fire here.
export function RequireImage({ alt, size, style }: RequireImageProps): JSX.Element {
  return (
    <FlexCompat
      {...(alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}
      style={{ height: size.height, width: size.width, ...style }}
    />
  )
}
