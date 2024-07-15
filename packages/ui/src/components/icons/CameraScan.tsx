import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [CameraScan, AnimatedCameraScan] = createIcon({
  name: 'CameraScan',
  getIcon: (props) => (
    <Svg fill="none" stroke="currentColor" strokeWidth="10" viewBox="0 0 274 274" {...props}>
      <Path
        d="M78.3333 5H34.3333C26.5536 5 19.0926 8.09047 13.5915 13.5915C8.09047 19.0926 5 26.5536 5 34.3333V78.3333M269 78.3333V34.3333C269 26.5536 265.91 19.0926 260.408 13.5915C254.907 8.09047 247.446 5 239.667 5H195.667M195.667 269H239.667C247.446 269 254.907 265.91 260.408 260.408C265.91 254.907 269 247.446 269 239.667V195.667M5 195.667V239.667C5 247.446 8.09047 254.907 13.5915 260.408C19.0926 265.91 26.5536 269 34.3333 269H78.3333"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
})
