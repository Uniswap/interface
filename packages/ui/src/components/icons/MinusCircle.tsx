import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [MinusCircle, AnimatedMinusCircle] = createIcon({
  name: 'MinusCircle',
  getIcon: (props) => (
    <Svg viewBox="0 0 20 20" fill="none" {...props}>
      <Path
        d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM13.5 10.75H6.5C6.09 10.75 5.75 10.41 5.75 10C5.75 9.59 6.09 9.25 6.5 9.25H13.5C13.91 9.25 14.25 9.59 14.25 10C14.25 10.41 13.91 10.75 13.5 10.75Z"
        fill="inherit"
      />
    </Svg>
  ),
})
