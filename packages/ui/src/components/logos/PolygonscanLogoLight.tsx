import { Defs, LinearGradient, Path, Stop, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [PolygonscanLogoLight, AnimatedPolygonscanLogoLight] = createIcon({
  name: 'PolygonscanLogoLight',
  getIcon: (props) => (
    <Svg viewBox="0 0 256 256" fill="none" {...props}>
      <Path
        d="M186.384 171.561L243.497 138.588C246.518 136.842 248.397 133.591 248.397 130.099V64.1433C248.397 60.6566 246.518 57.4003 243.497 55.6543L186.384 22.6815C183.363 20.9356 179.605 20.9407 176.584 22.6815L119.47 55.6543C116.45 57.4003 114.571 60.6515 114.571 64.1433V182.001L74.5219 205.117L34.4733 182.001V135.752L74.5219 112.635L100.941 127.882V96.8601L79.4218 84.439C77.937 83.5839 76.2422 83.1334 74.5219 83.1334C72.8016 83.1334 71.1069 83.5839 69.6221 84.439L12.5034 117.417C9.48256 119.163 7.60352 122.414 7.60352 125.906V191.857C7.60352 195.343 9.48256 198.6 12.5034 200.346L69.617 233.323C72.6378 235.064 76.3907 235.064 79.4166 233.323L136.53 200.351C139.551 198.605 141.43 195.348 141.43 191.862V74.0044L142.152 73.5897L181.479 50.8876L221.527 74.0095V120.253L181.479 143.375L155.1 128.148V159.171L176.579 171.576C179.6 173.317 183.358 173.317 186.379 171.576L186.384 171.561Z"
        fill="url(#paint0_linear_4864_1937)"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_4864_1937"
          x1="28.0733"
          y1="200.863"
          x2="235.024"
          y2="49.9609"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#000" />
          <Stop offset="0.88" stopColor="#000" />
          <Stop offset="1" stopColor="#000" />
        </LinearGradient>
      </Defs>
    </Svg>
  ),
})
