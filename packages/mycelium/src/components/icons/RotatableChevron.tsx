import { memo } from 'react'
import type { ReactElement } from 'react'
import { cn } from '../../cn'
import { FlexCompat } from '../../flex-compat/FlexCompat'
import type { FlexCompatProps } from '../../flex-compat/props'
import type { IconProps } from '../factories/createIcon'
import { Chevron } from './Chevron'
import { isRTL, ROTATE_TRANSITION_CLASS } from './rotation-platform'

// `direction` here is the chevron's heading, not the compat surface's CSS
// `direction` long-tail prop; `rotate` is derived from it, so neither is
// forwarded.
type Props = {
  size?: IconProps['size']
  direction?: 'up' | 'right' | 'down' | 'left' | 'start' | 'end'
  color?: string
} & Omit<FlexCompatProps, 'direction' | 'rotate' | 'children'>

function getDegree(direction: NonNullable<Props['direction']>): string {
  switch (direction) {
    case 'start':
      return isRTL() ? '180deg' : '0deg'
    case 'end':
      return isRTL() ? '0deg' : '180deg'
    case 'up':
      return '90deg'
    case 'right':
      return '180deg'
    case 'down':
      return '270deg'
    case 'left':
    default:
      return '0deg'
  }
}

function RotatableChevronIcon({ color, size = 24, direction = 'start', className, ...rest }: Props): ReactElement {
  // The rotation rides the compat `rotate` PROP, never a style object: only the
  // prop reaches the transform lane that emits RN's transform array. A CSS
  // string in `style` is handed to the native host verbatim, which is the shape
  // react-native-svg's parser rejects on device.
  return (
    // position="static": this wrapper renders in ~40 call sites across apps/web
    // (dropdowns, breadcrumbs, expandables, …), some of which stack it over a
    // stretched overlay link. FlexCompat's `relative` frame default would make
    // it the nearest positioned ancestor there and swallow the overlay's tap --
    // keep it unpositioned, matching the retired cva Flex's default.
    <FlexCompat
      centered
      position="static"
      borderRadius="$roundedFull"
      rotate={getDegree(direction)}
      className={cn(ROTATE_TRANSITION_CLASS, className)}
      {...rest}
    >
      <Chevron color={color} size={size} />
    </FlexCompat>
  )
}
export const RotatableChevron = memo(RotatableChevronIcon)
