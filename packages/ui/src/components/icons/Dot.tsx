import { Circle as _Circle, G, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Dot, AnimatedDot] = createIcon({
  name: 'Dot',
  getIcon: (props) => (
    <Svg viewBox="0 0 16 16" fill="none" {...props}>
      <G id="Dot">
        <_Circle id="Ellipse 4" cx="8" cy="8" r="6" fill="currentColor" fillOpacity="0.08" />
        <_Circle id="Ellipse 5" cx="8" cy="8" r="2" fill="currentColor" fillOpacity="0.63" />
      </G>
    </Svg>
  ),
  defaultFill: '#131313',
})
