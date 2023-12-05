import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Home, AnimatedHome] = createIcon({
  name: 'Home',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 20 22" {...props}>
      <Path
        d="M7 21.001V11.001H13V21.001M1 8.00098L10 1.00098L19 8.00098V19.001C19 19.5314 18.7893 20.0401 18.4142 20.4152C18.0391 20.7903 17.5304 21.001 17 21.001H3C2.46957 21.001 1.96086 20.7903 1.58579 20.4152C1.21071 20.0401 1 19.5314 1 19.001V8.00098Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </Svg>
  ),
})
