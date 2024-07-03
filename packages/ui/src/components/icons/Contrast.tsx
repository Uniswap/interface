import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Contrast, AnimatedContrast] = createIcon({
  name: 'Contrast',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 18.08C12 18.4 11.73 18.67 11.42 18.64C8.01001 18.35 5.32999 15.48 5.32999 12C5.32999 8.52 8.01001 5.64999 11.42 5.35999C11.73 5.32999 12 5.60001 12 5.92001V18.08Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
