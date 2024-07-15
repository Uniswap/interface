import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ApproveFilled, AnimatedApproveFilled] = createIcon({
  name: 'ApproveFilled',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 42 43" {...props}>
      <Path
        d="M21 4C11.34 4 3.5 11.84 3.5 21.5S11.34 39 21 39s17.5-7.84 17.5-17.5S30.66 4 21 4Zm7.052 14.35-8.172 8.155a1.242 1.242 0 0 1-.928.385c-.332 0-.665-.123-.927-.385l-4.077-4.078a1.32 1.32 0 0 1 0-1.855 1.32 1.32 0 0 1 1.854 0l3.15 3.15 7.245-7.227a1.29 1.29 0 0 1 1.855 0 1.32 1.32 0 0 1 0 1.855Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
