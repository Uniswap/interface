import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Flashbots, AnimatedFlashbots] = createIcon({
  name: 'Flashbots',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 24 24" {...props}>
      <Path
        d="M1.5 3.75L1.5 10.25M22.5 3.75V10.25M9.1875 9.75V12M14.8125 9.75V12M9 15.75H15M8.25 21H15.75C17.8211 21 19.5 19.2618 19.5 17.1176V6.44118C19.5 5.36909 18.6605 4.5 17.625 4.5H6.375C5.33947 4.5 4.5 5.36909 4.5 6.44118V17.1176C4.5 19.2618 6.17893 21 8.25 21Z"
        stroke="currentColor"
      />
    </Svg>
  ),
})
