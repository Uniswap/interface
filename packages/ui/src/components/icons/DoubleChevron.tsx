import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [DoubleChevron, AnimatedDoubleChevron] = createIcon({
  name: 'DoubleChevron',
  getIcon: (props) => (
    <Svg viewBox="0 0 10 14" fill="none" {...props}>
      <Path d="M1 9L5 13L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 5L5 1L1 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
})
