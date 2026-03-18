import { Path, Rect, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Moonpay, AnimatedMoonpay] = createIcon({
  name: 'Moonpay',
  getIcon: (props) => (
    <Svg viewBox="0 0 36 36" fill="none" {...props}>
      <Rect width="36" height="36" rx="18" fill="currentColor" />
      <Path
        d="M24.933 14.14a3.07 3.07 0 0 0 0-6.14 3.07 3.07 0 0 0 0 6.14ZM15.5 28A7.495 7.495 0 0 1 8 20.493a7.495 7.495 0 0 1 7.5-7.506c4.149 0 7.5 3.354 7.5 7.506A7.495 7.495 0 0 1 15.5 28Z"
        fill="currentColor"
      />
    </Svg>
  ),
  defaultFill: '#7D00FF',
})
