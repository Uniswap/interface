import { Path, Svg, SvgProps } from 'react-native-svg'

// WALL-4653: Allows you to customize the `fill` parameter of the `Heart.tsx` component,
// which prevents the color from fading when the iOS share dialog is opened.
export function HeartWithFill(props: SvgProps): JSX.Element {
  return (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M22.7927 11.1242C21.359 18.5187 12.0003 22.7782 12.0003 22.7782C12.0003 22.7782 2.64153 18.5187 1.20661 11.1242C0.326598 6.58719 2.24925 2.02329 7.13701 2.00007C10.7781 1.98296 12.0003 5.65211 12.0003 5.65211C12.0003 5.65211 13.2226 1.98173 16.8624 2.00007C21.7612 2.02329 23.6727 6.58841 22.7927 11.1242Z"
        fill={props.color || 'currentColor'}
      />
    </Svg>
  )
}
