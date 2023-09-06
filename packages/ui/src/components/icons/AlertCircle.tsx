import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [AlertCircle, AnimatedAlertCircle] = createIcon({
  name: 'AlertCircle',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 22 22" {...props}>
      <Path
        d="M11 21a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
        stroke={props.style?.color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <Path
        d="M11 7v4"
        stroke={props.style?.color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <Path
        d="M11 15h0"
        stroke={props.style?.color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </Svg>
  ),
})
