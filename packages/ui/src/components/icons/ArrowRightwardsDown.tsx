import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ArrowRightwardsDown, AnimatedArrowRightwardsDown] = createIcon({
  name: 'ArrowRightwardsDown',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 15 16" {...props}>
      <Path
        d="M5.875 10.4375L9.9375 14.5L14 10.4375"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <Path
        d="M1 1.5H6.6875C7.54945 1.5 8.3761 1.84241 8.9856 2.4519C9.59509 3.0614 9.9375 3.88805 9.9375 4.75V14.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </Svg>
  ),
})
