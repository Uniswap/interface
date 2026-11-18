import { Text, type TextCompatProps } from '@universe/mycelium'
import { forwardRef, type ForwardRefExoticComponent, type RefAttributes } from 'react'

type InfoBadgeSize = 'default' | 'small' | 'compact'
export type InfoBadgePlacement = 'start' | 'middle' | 'end' | 'only'

const BADGE_SIZE_PROPS: Record<InfoBadgeSize, TextCompatProps> = {
  default: { variant: 'body3' },
  small: { variant: 'body4' },
  compact: { variant: 'body4', py: '$spacing1', px: '$spacing4' },
}

const BADGE_PLACEMENT_PROPS: Record<InfoBadgePlacement, TextCompatProps> = {
  start: { borderTopLeftRadius: '$rounded4', borderBottomLeftRadius: '$rounded4' },
  middle: {},
  end: { borderTopRightRadius: '$rounded4', borderBottomRightRadius: '$rounded4' },
  only: { borderRadius: '$rounded4' },
}

type InfoBadgeProps = TextCompatProps & { size?: InfoBadgeSize; placement?: InfoBadgePlacement }

/**
 * The pools UI's info chip (protocol version, hook, fee tier). Chips sit in a joined run, 2px apart, and
 * only the run's outer corners are rounded: give each its `placement` in the run.
 */
// Explicit return type: forwardRef's inferred type isn't nameable under declaration emit (TS2883).
export const InfoBadge: ForwardRefExoticComponent<InfoBadgeProps & RefAttributes<HTMLElement>> = forwardRef<
  HTMLElement,
  InfoBadgeProps
>(function InfoBadge({ size, placement, ...rest }, ref) {
  return (
    <Text
      ref={ref}
      display="flex"
      flexDirection="row"
      alignItems="center"
      gap="$spacing2"
      variant="body3"
      color="$neutral2"
      backgroundColor="$surface3"
      py="$spacing2"
      px="$padding6"
      {...(size ? BADGE_SIZE_PROPS[size] : {})}
      {...(placement ? BADGE_PLACEMENT_PROPS[placement] : {})}
      {...rest}
    />
  )
})

export function infoBadgePlacement(index: number, length: number): InfoBadgePlacement {
  return length === 1 ? 'only' : index === 0 ? 'start' : index === length - 1 ? 'end' : 'middle'
}
