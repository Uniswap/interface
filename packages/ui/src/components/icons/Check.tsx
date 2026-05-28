import { Line, Svg } from 'react-native-svg'
// oxlint-disable-next-line universe-custom/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Check, AnimatedCheck] = createIcon({
  name: 'Check',
  getIcon: (props) => (
    <Svg stroke="currentColor" viewBox="0 0 48 48" fill="none" strokeWidth="5" strokeLinecap="round" {...props}>
      <Line x1="11" y1="26" x2="18" y2="33" stroke="currentColor" />
      <Line x1="18" y1="33" x2="38" y2="14" stroke="currentColor" />
    </Svg>
  ),
})
