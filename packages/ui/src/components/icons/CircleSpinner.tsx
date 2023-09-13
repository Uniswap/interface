import { Circle as _Circle, Path, Svg } from 'react-native-svg'

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
      <_Circle cx="12" cy="12" fill={'currentColor' ?? '#99A1BD'} fillOpacity="0.14" r="6" />
    </Svg>
  ),
  defaultFill: '#99A1BD',
})
