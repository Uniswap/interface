import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Chevron, AnimatedChevron] = createIcon({
  name: 'Chevron',
  getIcon: (props) => (
    <Svg stroke="currentColor" viewBox="0 0 24 24" fill="none" {...props}>
      <Path d="M15 6L9 12L15 18" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
    </Svg>
  ),
})
