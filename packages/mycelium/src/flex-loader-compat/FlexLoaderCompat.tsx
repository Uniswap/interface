import type { JSX } from 'react'
import { FlexCompat } from '../flex-compat/FlexCompat'
import type { FlexLoaderProps } from './props'

/**
 * Replacement for the legacy ui `FlexLoader`: a column of
 * `repeat` solid placeholder blocks. It carries no sweep of its own — call
 * sites wrap it in `Shimmer` (legacy `Skeleton`/`Shine`) for the animation,
 * exactly like the legacy `Loader.Box`.
 *
 * No platform split of its own: it composes `FlexCompat` by its BASE
 * specifier, so each bundler resolves the flex compat's own web/native leg.
 */
export function FlexLoaderCompat({
  repeat = 1,
  backgroundColor = '$neutral3',
  borderRadius = '$rounded12',
  width = '100%',
  height,
  ...props
}: FlexLoaderProps): JSX.Element {
  return (
    // The marker class is legacy DOM carried over (nothing styles it; it only
    // names the wrapper in devtools/snapshots).
    <FlexCompat className="FlexLoader">
      {Array.from({ length: repeat }, (_, i) => (
        <FlexCompat
          key={i}
          backgroundColor={backgroundColor}
          borderRadius={borderRadius}
          height={height}
          width={width}
          {...props}
        />
      ))}
    </FlexCompat>
  )
}
