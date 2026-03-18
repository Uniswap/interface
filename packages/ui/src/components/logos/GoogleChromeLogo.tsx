import { Circle as _Circle, Defs, LinearGradient, Path, Stop, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [GoogleChromeLogo, AnimatedGoogleChromeLogo] = createIcon({
  name: 'GoogleChromeLogo',
  getIcon: (props) => (
    <Svg viewBox="0 0 48 48" {...props}>
      <Defs>
        <LinearGradient id="a" x1="3.2173" y1="15" x2="44.7812" y2="15" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#d93025" />
          <Stop offset="1" stopColor="#ea4335" />
        </LinearGradient>
        <LinearGradient id="b" x1="20.7219" y1="47.6791" x2="41.5039" y2="11.6837" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#fcc934" />
          <Stop offset="1" stopColor="#fbbc04" />
        </LinearGradient>
        <LinearGradient id="c" x1="26.5981" y1="46.5015" x2="5.8161" y2="10.506" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#1e8e3e" />
          <Stop offset="1" stopColor="#34a853" />
        </LinearGradient>
        <LinearGradient id="d" x1="24" y1="24" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#1a73e8" />
          <Stop offset="1" stopColor="#1a73e8" />
        </LinearGradient>
      </Defs>
      <_Circle cx="24" cy="23.9947" r="12" fill="currentColor" />
      <Path
        d="M3.2154,36A24,24,0,1,0,12,3.2154,24,24,0,0,0,3.2154,36ZM34.3923,18A12,12,0,1,1,18,13.6077,12,12,0,0,1,34.3923,18Z"
        fill="none"
      />
      <Path
        d="M24,12H44.7812a23.9939,23.9939,0,0,0-41.5639.0029L13.6079,30l.0093-.0024A11.9852,11.9852,0,0,1,24,12Z"
        fill="url(#a)"
      />
      <_Circle cx="24" cy="24" r="9.5" fill="url(#d)" />
      <Path
        d="M34.3913,30.0029,24.0007,48A23.994,23.994,0,0,0,44.78,12.0031H23.9989l-.0025.0093A11.985,11.985,0,0,1,34.3913,30.0029Z"
        fill="url(#b)"
      />
      <Path
        d="M13.6086,30.0031,3.218,12.006A23.994,23.994,0,0,0,24.0025,48L34.3931,30.0029l-.0067-.0068a11.9852,11.9852,0,0,1-20.7778.007Z"
        fill="url(#c)"
      />
    </Svg>
  ),
  defaultFill: '#fff',
})
