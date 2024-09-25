import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Plus, AnimatedPlus] = createIcon({
  name: 'Plus',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M19 11H13V5C13 4.448 12.552 4 12 4C11.448 4 11 4.448 11 5V11H5C4.448 11 4 11.448 4 12C4 12.552 4.448 13 5 13H11V19C11 19.552 11.448 20 12 20C12.552 20 13 19.552 13 19V13H19C19.552 13 20 12.552 20 12C20 11.448 19.552 11 19 11Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
