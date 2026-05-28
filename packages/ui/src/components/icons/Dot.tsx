import { Circle, G, Svg } from 'react-native-svg'
// oxlint-disable-next-line universe-custom/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Dot, AnimatedDot] = createIcon({
  name: 'Dot',
  getIcon: (props) => (
    <Svg viewBox="0 0 16 16" fill="none" {...props}>
      <G id="Dot">
        <Circle id="Ellipse 4" cx="8" cy="8" r="6" fill="currentColor" fillOpacity="0.08" />
        <Circle id="Ellipse 5" cx="8" cy="8" r="2" fill="currentColor" fillOpacity="0.63" />
      </G>
    </Svg>
  ),
  defaultFill: '#131313',
})
