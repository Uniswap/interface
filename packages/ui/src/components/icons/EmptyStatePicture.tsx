import type { IconProps } from '@tamagui/helpers-icon'
import { forwardRef, memo } from 'react'
import { Circle as _Circle, Path, Rect, Svg } from 'react-native-svg'
import { getTokenValue, isWeb, useTheme } from 'tamagui'

const Icon = forwardRef<Svg, IconProps>((props, ref) => {
  // isWeb currentColor to maintain backwards compat a bit better, on native uses theme color
  const {
    color: colorProp = isWeb ? 'currentColor' : undefined,
    size: sizeProp = '$true',
    strokeWidth: strokeWidthProp,
    ...restProps
  } = props
  const theme = useTheme()

  const size =
    getTokenValue(
      // @ts-expect-error it falls back to undefined
      sizeProp,
      'size'
    ) ?? sizeProp

  const strokeWidth =
    getTokenValue(
      // @ts-expect-error it falls back to undefined
      strokeWidthProp,
      'size'
    ) ?? strokeWidthProp

  const color =
    // @ts-expect-error its fine to access colorProp undefined
    theme[colorProp]?.get() ?? colorProp ?? theme.color.get()

  const svgProps = {
    ...restProps,
    size,
    strokeWidth,
    color,
  }

  return (
    <Svg ref={ref} fill="none" height={size} viewBox="0 0 57 66" width={size} {...svgProps}>
      <Rect
        height="52.166"
        rx="5.617"
        stroke={color}
        strokeWidth="2.4"
        width="39.125"
        x="1.667"
        y="12.637"
      />
      <Path
        clipRule="evenodd"
        d="M23.857.982a6.817 6.817 0 0 0-8.085 5.25l-1.361 6.405h2.454l1.255-5.905a4.417 4.417 0 0 1 5.238-3.402L50.64 9.129a4.417 4.417 0 0 1 3.402 5.239l-8.51 40.038a4.417 4.417 0 0 1-4.74 3.479v1.301c0 .376-.037.743-.108 1.099a6.818 6.818 0 0 0 7.195-5.38l8.51-40.038a6.817 6.817 0 0 0-5.25-8.086L23.857.982Z"
        fill={color}
        fillRule="evenodd"
      />
      <_Circle cx="11.856" cy="27.716" fill={color} r="5.298" />
      <Path
        d="M10.113 38.928c-3.964.484-6.746 4.311-7.631 6.898v12.49a5.617 5.617 0 0 0 5.616 5.616H34.36a5.617 5.617 0 0 0 5.616-5.616v-23.7c-1.106-2.011-4.38-5.776-8.627-4.741-4.247 1.034-9.954 10.203-12.608 15.089-.996-2.333-3.65-6.644-8.628-6.036Z"
        fill={color}
      />
    </Svg>
  )
})

Icon.displayName = 'EmptyStatePicture'

export const EmptyStatePicture = memo<IconProps>(Icon)
