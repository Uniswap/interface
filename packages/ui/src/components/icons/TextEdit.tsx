import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [TextEdit, AnimatedTextEdit] = createIcon({
  name: 'TextEdit',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 24 24" {...props}>
      <Path
        d="M17.0371 12.0019L8 21H3V16L11.998 6.963C12.115 6.845 12.3051 6.845 12.4231 6.963L17.0381 11.578C17.1551 11.695 17.1551 11.8849 17.0371 12.0019ZM18.1079 10.5279C18.2249 10.6449 18.415 10.6449 18.532 10.5279L20.4099 8.65001C21.1939 7.86601 21.1939 6.59405 20.4099 5.81005L18.1899 3.58995C17.4059 2.80595 16.1341 2.80595 15.3501 3.58995L13.4719 5.468C13.3549 5.585 13.3549 5.77496 13.4719 5.89196L18.1079 10.5279ZM21 20.25H14C13.586 20.25 13.25 20.586 13.25 21C13.25 21.414 13.586 21.75 14 21.75H21C21.414 21.75 21.75 21.414 21.75 21C21.75 20.586 21.414 20.25 21 20.25Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
