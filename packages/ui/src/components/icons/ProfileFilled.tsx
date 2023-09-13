import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ProfileFilled, AnimatedProfileFilled] = createIcon({
  name: 'ProfileFilled',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 18 20" {...props}>
      <Path
        d="M1.46447 13.4645C2.40215 12.5268 3.67392 12 5 12H13C14.3261 12 15.5979 12.5268 16.5355 13.4645C17.4732 14.4021 18 15.6739 18 17V19C18 19.5523 17.5523 20 17 20H1C0.447715 20 0 19.5523 0 19V17C0 15.6739 0.526784 14.4021 1.46447 13.4645Z"
        fill="currentColor"
      />
      <Path
        d="M4 5C4 2.23858 6.23858 0 9 0C11.7614 0 14 2.23858 14 5C14 7.76142 11.7614 10 9 10C6.23858 10 4 7.76142 4 5Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
