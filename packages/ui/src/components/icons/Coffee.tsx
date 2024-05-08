import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Coffee, AnimatedCoffee] = createIcon({
  name: 'Coffee',
  getIcon: (props) => (
    <Svg fill="none" stroke="currentColor" viewBox="0 0 20 19" {...props}>
      <Path
        d="M15 6.7h.8a3.3 3.3 0 0 1 0 6.6H15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <Path
        d="M1.7 6.7H15v7.5a3.3 3.3 0 0 1-3.3 3.3H5a3.3 3.3 0 0 1-3.3-3.3V6.7Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <Path
        d="M5 .8v2.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <Path
        d="M8.3.8v2.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <Path
        d="M11.7.8v2.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </Svg>
  ),
})
