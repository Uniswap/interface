import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [PencilBox, AnimatedPencilBox] = createIcon({
  name: 'PencilBox',
  getIcon: (props) => (
    <Svg fill="none" stroke="currentColor" viewBox="0 0 20 20" {...props}>
      <Path
        d="M9.2 3.3H3.3A1.7 1.7 0 0 0 1.7 5v11.7a1.7 1.7 0 0 0 1.6 1.6H15a1.7 1.7 0 0 0 1.7-1.6v-5.9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <Path
        d="M15.4 2A1.8 1.8 0 0 1 18 4.7L10 12.5l-3.3.8.8-3.3 8-8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </Svg>
  ),
})
