import { Defs, LinearGradient, Path, Stop, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [RingswapLogo, AnimatedRingswapLogo] = createIcon({
  name: 'RingswapLogo',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 96 96" {...props}>
      <Defs>
        <LinearGradient id="ring-gradient" x1={6.17} y1={54.34} x2={78.28} y2={54.34} gradientUnits="userSpaceOnUse">
          <Stop offset={0} stopColor="#f15266" />
          <Stop offset={0.52} stopColor="#bc74ed" />
          <Stop offset={1} stopColor="#1abee9" />
        </LinearGradient>

        <LinearGradient id="ring-gradient-2" x1={59.26} y1={20.49} x2={92.87} y2={20.49} gradientUnits="userSpaceOnUse">
          <Stop offset={0} stopColor="#f15266" />
          <Stop offset={0.52} stopColor="#bc74ed" />
          <Stop offset={1} stopColor="#1abee9" />
        </LinearGradient>
      </Defs>

      <Path
        fill="url(#ring-gradient)"
        d="M42.27,90.41a36.07,36.07,0,1,1,36-36.21A36,36,0,0,1,42.27,90.41ZM16,54.38c-.22,14.07,11.52,26,25.82,26.2A26.25,26.25,0,1,0,16,54.38Z"
        transform="translate(-6.17 -3.72)"
      />

      <Path
        fill="url(#ring-gradient-2)"
        d="M59.26,10.33l6.89-6.61L92.87,30.5l-7,6.75Z"
        transform="translate(-6.17 -3.72)"
      />
    </Svg>
  ),
})
