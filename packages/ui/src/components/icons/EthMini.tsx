import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [EthMini, AnimatedEthMini] = createIcon({
  name: 'EthMini',
  getIcon: (props) => (
    <Svg viewBox="0 0 20 20" fill="none" {...props}>
      <Path
        d="M13.9233 10.14L9.99983 11.5213L6.07752 10.14C5.86644 10.065 5.77104 9.80876 5.87837 9.60375L9.42859 2.8469C9.67903 2.38437 10.323 2.38437 10.5735 2.8469L14.1237 9.60375C14.2298 9.80751 14.1344 10.065 13.9233 10.14Z"
        fill="currentColor"
      />
      <Path
        d="M13.5011 12.7514L10.5365 17.2094C10.2741 17.5969 9.72553 17.5969 9.46317 17.2094L6.49852 12.7514C6.36734 12.5539 6.55218 12.2952 6.76922 12.3715L9.71363 13.3965C9.80903 13.434 9.90443 13.4465 9.99983 13.4465C10.0952 13.4465 10.1906 13.434 10.286 13.3965L13.2304 12.3715C13.4475 12.2952 13.6323 12.5539 13.5011 12.7514Z"
        fill="currentColor"
      />
    </Svg>
  ),
  defaultFill: '#131313',
})
