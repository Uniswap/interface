import { Path, Svg } from 'react-native-svg'
// oxlint-disable-next-line universe-custom/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ArrowDown, AnimatedArrowDown] = createIcon({
  name: 'ArrowDown',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M19 12L12 19L5 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
})
