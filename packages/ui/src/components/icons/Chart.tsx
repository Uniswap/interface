import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Chart, AnimatedChart] = createIcon({
  name: 'Chart',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12.5 21H11.5C10.5 21 10 20.5 10 19.5V4.5C10 3.5 10.5 3 11.5 3H12.5C13.5 3 14 3.5 14 4.5V19.5C14 20.5 13.5 21 12.5 21ZM21 19.5V9.5C21 8.5 20.5 8 19.5 8H18.5C17.5 8 17 8.5 17 9.5V19.5C17 20.5 17.5 21 18.5 21H19.5C20.5 21 21 20.5 21 19.5ZM7 19.5V13.5C7 12.5 6.5 12 5.5 12H4.5C3.5 12 3 12.5 3 13.5V19.5C3 20.5 3.5 21 4.5 21H5.5C6.5 21 7 20.5 7 19.5Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
