import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Cloud, AnimatedCloud] = createIcon({
  name: 'Cloud',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 24 24" {...props}>
      <Path
        d="M15.03 9.09003C15.35 9.03003 15.67 9 16 9C18.76 9 21 11.24 21 14C21 16.76 18.76 19 16 19H9.5C5.91 19 3 16.09 3 12.5C3 8.91 5.91 6 9.5 6C11.146 6 12.648 6.61297 13.792 7.62097C14.274 8.04597 14.692 8.54103 15.03 9.09003Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
