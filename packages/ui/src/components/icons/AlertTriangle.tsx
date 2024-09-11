import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [AlertTriangle, AnimatedAlertTriangle] = createIcon({
  name: 'AlertTriangle',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </Svg>
  ),
})
