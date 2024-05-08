import { Defs, LinearGradient, Path, Stop, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Eyeball, AnimatedEyeball] = createIcon({
  name: 'Eyeball',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 18 13" {...props}>
      <Path
        clipRule="evenodd"
        d="M0 6.5C1.183 2.73279 4.70229 0 8.86043 0C13.0186 0 16.5379 2.73279 17.7209 6.5C16.5379 10.2672 13.0186 13 8.86043 13C4.70229 13 1.183 10.2672 0 6.5ZM12.5747 6.5C12.5747 7.48509 12.1834 8.42983 11.4868 9.1264C10.7903 9.82296 9.84552 10.2143 8.86043 10.2143C7.87534 10.2143 6.9306 9.82296 6.23403 9.1264C5.53747 8.42983 5.14614 7.48509 5.14614 6.5C5.14614 5.51491 5.53747 4.57017 6.23403 3.8736C6.9306 3.17704 7.87534 2.78571 8.86043 2.78571C9.84552 2.78571 10.7903 3.17704 11.4868 3.8736C12.1834 4.57017 12.5747 5.51491 12.5747 6.5Z"
        fill="url(#paint0_linear_726_11719)"
        fillRule="evenodd"
      />
      <Defs>
        <LinearGradient
          gradientUnits="userSpaceOnUse"
          id="paint0_linear_726_11719"
          x1="2.95348"
          x2="15.3182"
          y1="0.984849"
          y2="19.8227">
          <Stop stopColor="#A2CDFF" />
          <Stop offset="1" stopColor="#A3A2FF" />
        </LinearGradient>
      </Defs>
    </Svg>
  ),
})
