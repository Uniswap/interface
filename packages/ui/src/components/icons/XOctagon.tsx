import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [XOctagon, AnimatedXOctagon] = createIcon({
  name: 'XOctagon',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 18 18" {...props}>
      <Path
        d="M5.895 1.5H12.105L16.5 5.895V12.105L12.105 16.5H5.895L1.5 12.105V5.895L5.895 1.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <Path
        d="M11.25 6.75L6.75 11.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <Path
        d="M6.75 6.75L11.25 11.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </Svg>
  ),
})
