import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Plus, AnimatedPlus] = createIcon({
  name: 'Plus',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 16 16" {...props}>
      <Path d="M8 1v14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M1 8h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
})
