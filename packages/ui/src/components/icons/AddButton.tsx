import { Path, Rect, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [AddButton, AnimatedAddButton] = createIcon({
  name: 'AddButton',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path d="M12 7.625V16.375" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7.625 12H16.375" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="1" y="1" width="22" height="22" rx="11" stroke="currentColor" strokeWidth="2" />
    </Svg>
  ),
})
