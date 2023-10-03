import type { IconProps } from '@tamagui/helpers-icon'
import { forwardRef, memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import { getTokenValue } from 'tamagui'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'

const Icon = forwardRef<Svg, IconProps>((props, ref) => {
  // isWeb currentColor to maintain backwards compat a bit better, on native uses theme color
  const {
    color: colorProp = '#FC72FF',
    size: sizeProp = '$true',
    strokeWidth: strokeWidthProp,
    ...restProps
  } = props
  const colors = useSporeColors()

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
    colors[colorProp]?.get() ?? colorProp ?? colors.color.get()

  const svgProps = {
    ...restProps,
    size,
    strokeWidth,
    color,
  }

  return (
    <Svg ref={ref} fill="none" height={size} viewBox="0 0 22 21" width={size} {...svgProps}>
      <Path
        d="M13.5906 13.7387C13.4248 13.7387 13.259 13.6756 13.1329 13.5487L8.40881 8.82463L3.68472 13.5487C3.43167 13.8017 3.02144 13.8017 2.7684 13.5487C2.51535 13.2956 2.51535 12.8854 2.7684 12.6323L7.95022 7.45053C8.20326 7.19748 8.61349 7.19748 8.86654 7.45053L13.5906 12.1746L18.3147 7.45053C18.5678 7.19748 18.978 7.19748 19.231 7.45053C19.4841 7.70357 19.4841 8.11383 19.231 8.36687L14.0492 13.5487C13.9223 13.6756 13.7564 13.7387 13.5906 13.7387Z"
        fill={color ?? '#FC72FF'}
        opacity="0.4"
      />
      <Path
        d="M18.7902 9.63716C17.8367 9.63716 17.0586 8.86334 17.0586 7.90989C17.0586 6.95644 17.8272 6.18262 18.7815 6.18262H18.7902C19.7436 6.18262 20.5175 6.95644 20.5175 7.90989C20.5175 8.86334 19.7445 9.63716 18.7902 9.63716Z"
        fill={color ?? '#FC72FF'}
      />
      <Path
        d="M8.42642 9.63716C7.47296 9.63716 6.69482 8.86334 6.69482 7.90989C6.69482 6.95644 7.46346 6.18262 8.41777 6.18262H8.42642C9.37987 6.18262 10.1537 6.95644 10.1537 7.90989C10.1537 8.86334 9.38074 9.63716 8.42642 9.63716Z"
        fill={color ?? '#FC72FF'}
      />
      <Path
        d="M13.6081 14.8188C12.6546 14.8188 11.8765 14.045 11.8765 13.0915C11.8765 12.1381 12.6451 11.3643 13.5994 11.3643H13.6081C14.5615 11.3643 15.3353 12.1381 15.3353 13.0915C15.3353 14.045 14.5624 14.8188 13.6081 14.8188Z"
        fill={color ?? '#FC72FF'}
      />
      <Path
        d="M3.24429 14.8188C2.29084 14.8188 1.5127 14.045 1.5127 13.0915C1.5127 12.1381 2.28133 11.3643 3.23565 11.3643H3.24429C4.19774 11.3643 4.97156 12.1381 4.97156 13.0915C4.97156 14.045 4.19861 14.8188 3.24429 14.8188Z"
        fill={color ?? '#FC72FF'}
      />
    </Svg>
  )
})

Icon.displayName = 'Multichain'

export const Multichain = memo<IconProps>(Icon)
