import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Hamburger, AnimatedHamburger] = createIcon({
  name: 'Hamburger',
  getIcon: (props) => (
    <Svg viewBox="0 0 18 12" fill="none" {...props}>
      <Path d="M1.5 6H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M1.5 1H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M1.5 11H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
})
