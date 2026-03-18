import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ArrowRight, AnimatedArrowRight] = createIcon({
  name: 'ArrowRight',
  getIcon: (props) => (
    <Svg viewBox="0 0 18 18" fill="none" {...props}>
      <Path
        d="M9.79261 16.1108L17.5398 8.36364L9.79261 0.616477L8.25852 2.15057L13.3807 7.25568H0V9.47159H13.3807L8.25852 14.5852L9.79261 16.1108Z"
        fill="currentColor"
      />
    </Svg>
  ),
  defaultFill: '#333639',
})
