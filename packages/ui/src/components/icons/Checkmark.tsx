import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Checkmark, AnimatedCheckmark] = createIcon({
  name: 'Checkmark',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 11 8" {...props}>
      <Path d="M1.3 4L3.8 6.5L9.3 1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
})
