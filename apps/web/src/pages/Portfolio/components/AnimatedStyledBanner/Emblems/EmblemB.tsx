import { EmblemProps } from 'pages/Portfolio/components/AnimatedStyledBanner/Emblems/types'
import { useSporeColors } from 'ui/src'

export function EmblemB({ fill = '#FF37C7', opacity = 1, ...props }: EmblemProps): JSX.Element {
  const colors = useSporeColors()

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M2 3C5.31371 3 8 5.68629 8 9C8 5.68629 10.6863 3 14 3L14 9C14 12.3137 11.3137 15 8 15C4.68629 15 2 12.3137 2 9V3Z"
        fill={colors.surface1.val}
      />
      <path
        d="M2 3C5.31371 3 8 5.68629 8 9C8 5.68629 10.6863 3 14 3L14 9C14 12.3137 11.3137 15 8 15C4.68629 15 2 12.3137 2 9V3Z"
        fill={fill}
        opacity={opacity}
      />
    </svg>
  )
}
