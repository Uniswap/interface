import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ErrorLoading, AnimatedErrorLoading] = createIcon({
  name: 'ErrorLoading',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 64 64" {...props}>
      <Path
        d="M27.4401 10.2929L4.85339 47.9996C4.3877 48.806 4.1413 49.7204 4.13869 50.6516C4.13609 51.5829 4.37736 52.4986 4.83853 53.3076C5.29969 54.1167 5.96466 54.7909 6.76728 55.2632C7.5699 55.7354 8.48219 55.9893 9.41339 55.9996H54.5867C55.5179 55.9893 56.4302 55.7354 57.2328 55.2632C58.0355 54.7909 58.7004 54.1167 59.1616 53.3076C59.6227 52.4986 59.864 51.5829 59.8614 50.6516C59.8588 49.7204 59.6124 48.806 59.1467 47.9996L36.5601 10.2929C36.0847 9.50919 35.4153 8.86122 34.6166 8.41153C33.8178 7.96183 32.9167 7.72559 32.0001 7.72559C31.0834 7.72559 30.1823 7.96183 29.3835 8.41153C28.5848 8.86122 27.9154 9.50919 27.4401 10.2929V10.2929Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <Path
        d="M32 24V34.6667"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <Path
        d="M32 45.333H32.0267"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </Svg>
  ),
})
