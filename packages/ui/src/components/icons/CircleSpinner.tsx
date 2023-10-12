import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [CircleSpinner, AnimatedCircleSpinner] = createIcon({
  name: 'CircleSpinner',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 24 24" {...props}>
      <Path
        d="M21 12C21 7.02944 16.9706 3 12 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
    </Svg>
  ),
})
