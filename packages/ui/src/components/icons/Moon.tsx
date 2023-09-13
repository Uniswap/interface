import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Moon, AnimatedMoon] = createIcon({
  name: 'Moon',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 24 24" {...props}>
      <Path
        d="M12.133 3C12.136 3 12.14 3 12.143 3C12.462 3 12.6 3.39301 12.36 3.60001C10.679 5.04701 9.75503 7.32199 10.226 9.77399C10.749 12.495 12.988 14.566 15.773 14.938C17.532 15.173 19.161 14.728 20.456 13.839C20.719 13.658 21.068 13.897 20.989 14.203C19.885 18.519 15.626 21.595 10.767 20.902C6.73101 20.326 3.54402 17.087 3.06602 13.095C2.81602 11.013 3.289 9.05101 4.27 7.42001C5.86 4.77401 8.78601 3 12.133 3Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
