import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Search, AnimatedSearch] = createIcon({
  name: 'Search',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 24 24" {...props}>
      <Path
        d="M10.5 17.9999C14.6421 17.9999 18 14.642 18 10.4999C18 6.35774 14.6421 2.99988 10.5 2.99988C6.35786 2.99988 3 6.35774 3 10.4999C3 14.642 6.35786 17.9999 10.5 17.9999Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <Path
        d="M21 20.9999L16 15.9999"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </Svg>
  ),
})
