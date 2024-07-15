import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ToggleOnAlt, AnimatedToggleOnAlt] = createIcon({
  name: 'ToggleOnAlt',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 24 24" {...props}>
      <Path
        d="M16 6H8C4.686 6 2 8.686 2 12C2 15.314 4.686 18 8 18H16C19.314 18 22 15.314 22 12C22 8.686 19.314 6 16 6ZM16 15C14.343 15 13 13.657 13 12C13 10.343 14.343 9 16 9C17.657 9 19 10.343 19 12C19 13.657 17.657 15 16 15Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
