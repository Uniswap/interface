import { Circle as _Circle, ClipPath, Defs, G, Path, Rect, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [EthereumLogo, AnimatedEthereumLogo] = createIcon({
  name: 'EthereumLogo',
  getIcon: (props) => (
    <Svg viewBox="0 0 20 20" fill="none" {...props}>
      <G clipPath="url(#clip0_2_30)">
        <Rect width="20" height="20" fill="currentColor" />
        <_Circle cx="10" cy="10" r="10" fill="currentColor" />
        <Path d="M9.97278 4L9.89323 4.27021V12.1105L9.97278 12.1899L13.6121 10.0386L9.97278 4Z" fill="currentColor" />
        <Path d="M9.97272 4L6.33333 10.0386L9.97272 12.1899V8.38441V4Z" fill="currentColor" />
        <Path
          d="M9.97273 12.8789L9.92789 12.9336V15.7264L9.97273 15.8573L13.6143 10.7288L9.97273 12.8789Z"
          fill="currentColor"
        />
        <Path d="M9.97272 15.8573V12.8789L6.33333 10.7288L9.97272 15.8573Z" fill="currentColor" />
        <Path d="M9.97266 12.1899L13.612 10.0386L9.97266 8.38441V12.1899Z" fill="currentColor" />
        <Path d="M6.33333 10.0386L9.97272 12.1899V8.38441L6.33333 10.0386Z" fill="currentColor" />
      </G>
      <Defs>
        <ClipPath id="clip0_2_30">
          <Rect width="20" height="20" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  defaultFill: '#EDF0F4',
})
