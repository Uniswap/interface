import { Line, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [DotLine, AnimatedDotLine] = createIcon({
  name: 'DotLine',
  getIcon: (props) => (
    <Svg width="100%" viewBox="850 0 300 200" {...props}>
      <Line
        x1="0"
        x2="3000"
        y1="100"
        y2="100"
        stroke="currentColor"
        strokeWidth="20"
        strokeLinecap="round"
        strokeDasharray="1, 45"
      />
    </Svg>
  ),
})
