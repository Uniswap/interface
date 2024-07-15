import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [SeedPhraseIcon, AnimatedSeedPhraseIcon] = createIcon({
  name: 'SeedPhraseIcon',
  getIcon: (props) => (
    <Svg viewBox="0 0 18 17" fill="none" {...props}>
      <Rect opacity="0.3" y="0.53125" width="8.46875" height="3.1875" rx="1.0625" fill="white" />
      <Rect opacity="0.2" x="9.53125" y="0.53125" width="8.46875" height="3.1875" rx="1.0625" fill="white" />
      <Rect y="4.78125" width="8.46875" height="3.1875" rx="1.0625" fill="url(#paint0_linear_726_11704)" />
      <Rect opacity="0.3" x="9.53125" y="4.78125" width="8.46875" height="3.1875" rx="1.0625" fill="white" />
      <Rect opacity="0.3" y="9.03125" width="8.46875" height="3.1875" rx="1.0625" fill="white" />
      <Rect opacity="0.8" x="9.53125" y="9.03125" width="8.46875" height="3.1875" rx="1.0625" fill="white" />
      <Rect opacity="0.2" y="13.2812" width="8.46875" height="3.1875" rx="1.0625" fill="white" />
      <Rect x="9.53125" y="13.2812" width="8.46875" height="3.1875" rx="1.0625" fill="url(#paint1_linear_726_11704)" />
      <Defs>
        <LinearGradient
          id="paint0_linear_726_11704"
          x1="1.41146"
          y1="5.02273"
          x2="3.41039"
          y2="10.9584"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#FF57EE" />
          <Stop offset="0.9375" stopColor="#FFB8A2" />
        </LinearGradient>
        <LinearGradient
          id="paint1_linear_726_11704"
          x1="10.9427"
          y1="13.5227"
          x2="12.9416"
          y2="19.4584"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#FF57EE" />
          <Stop offset="0.9375" stopColor="#FFB8A2" />
        </LinearGradient>
      </Defs>
    </Svg>
  ),
})
