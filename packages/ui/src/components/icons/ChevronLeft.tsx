import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ChevronLeft, AnimatedChevronLeft] = createIcon({
  name: 'ChevronLeft',
  getIcon: (props) => (
    <Svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <Path d="M15 6L9 12L15 18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </Svg>
  ),
})
