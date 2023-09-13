import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ArrowDown, AnimatedArrowDown] = createIcon({
  name: 'ArrowDown',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 24 24" {...props}>
      <Path
        d="M12 5V19"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <Path
        d="M19 12L12 19L5 12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </Svg>
  ),
})
