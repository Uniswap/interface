import { EmblemProps } from 'pages/Portfolio/components/AnimatedStyledBanner/Emblems/types'
import { useSporeColors } from 'ui/src'

export function EmblemA({ fill = '#FF37C7', opacity = 1, ...props }: EmblemProps): JSX.Element {
  const colors = useSporeColors()

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M15 2C15 1.44772 14.5523 1 14 1H9C8.44772 1 8 1.44772 8 2V8H14C14.5523 8 15 7.55228 15 7V2Z"
        fill={colors.surface1.val}
      />
      <path
        d="M8 8H2C1.44771 8 1 8.44772 1 9V14C1 14.5523 1.44772 15 2 15H7C7.55228 15 8 14.5523 8 14V8Z"
        fill={colors.surface1.val}
      />
      <path
        d="M15 2C15 1.44772 14.5523 1 14 1H9C8.44772 1 8 1.44772 8 2V8H14C14.5523 8 15 7.55228 15 7V2Z"
        fill={fill}
        opacity={opacity}
      />
      <path
        d="M8 8H2C1.44771 8 1 8.44772 1 9V14C1 14.5523 1.44772 15 2 15H7C7.55228 15 8 14.5523 8 14V8Z"
        fill={fill}
        opacity={opacity}
      />
    </svg>
  )
}
