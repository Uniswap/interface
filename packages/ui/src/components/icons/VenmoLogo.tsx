import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [VenmoLogo, AnimatedVenmoLogo] = createIcon({
  name: 'VenmoLogo',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M17.2688 5C17.7728 5.84047 18 6.70615 18 7.79969C18 11.2875 15.0514 15.8184 12.6583 19H7.1922L5 5.76364L9.78614 5.30481L10.9452 14.7233C12.0282 12.9418 13.3646 10.1421 13.3646 8.23331C13.3646 7.18851 13.1874 6.47686 12.9103 5.8909L17.2688 5Z"
        fill="currentColor"
      />
    </Svg>
  ),
  defaultFill: '#131313',
})
