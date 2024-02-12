import { Svg, Circle as _Circle } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [EmptySpinner, AnimatedEmptySpinner] = createIcon({
  name: 'EmptySpinner',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 20 20" {...props}>
      <_Circle cx="10" cy="10" r="8" stroke="currentColor" strokeOpacity="0.24" strokeWidth="3" />
    </Svg>
  ),
})
