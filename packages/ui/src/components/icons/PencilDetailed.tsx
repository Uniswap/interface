import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [PencilDetailed, AnimatedPencilDetailed] = createIcon({
  name: 'PencilDetailed',
  getIcon: (props) => (
    <Svg viewBox="0 0 25 24" fill="none" {...props}>
      <Path
        d="M17.5371 11.577C17.6541 11.694 17.6541 11.8849 17.5371 12.0019L8.5 21H3.5V16L12.498 6.963C12.615 6.845 12.8051 6.845 12.9231 6.963L17.5371 11.577ZM20.9099 5.81005L18.6899 3.58995C17.9059 2.80595 16.6341 2.80595 15.8501 3.58995L13.9719 5.468C13.8549 5.58501 13.8549 5.77496 13.9719 5.89196L18.6079 10.5279C18.7249 10.6449 18.915 10.6449 19.032 10.5279L20.9099 8.65001C21.6939 7.86601 21.6939 6.59405 20.9099 5.81005Z"
        fill="currentColor"
      />
    </Svg>
  ),
  defaultFill: '#FC72FF',
})
