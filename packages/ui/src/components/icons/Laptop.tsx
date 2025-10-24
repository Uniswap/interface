import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Laptop, AnimatedLaptop] = createIcon({
  name: 'Laptop',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M20 7V14.2C20 14.366 19.866 14.5 19.7 14.5H4.30005C4.13405 14.5 4 14.366 4 14.2V7C4 5 5 4 7 4H17C19 4 20 5 20 7ZM20.7 16H3.30005C3.13405 16 3 16.134 3 16.3V17C3 18.333 3.667 19 5 19H19C20.333 19 21 18.333 21 17V16.3C21 16.134 20.866 16 20.7 16Z"
        fill="currentColor"
      />
    </Svg>
  ),
  defaultFill: '#FF5F52',
})
