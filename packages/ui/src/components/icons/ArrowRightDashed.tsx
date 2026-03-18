import { Path, Rect, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ArrowRightDashed, AnimatedArrowRightDashed] = createIcon({
  name: 'ArrowRightDashed',
  getIcon: (props) => (
    <Svg viewBox="0 0 20 20" fill="none" {...props}>
      <Path
        d="M14.5 9.99951L9.41107 4.75674C9.08563 4.4313 9.08563 3.90366 9.41107 3.57823C9.73651 3.25279 10.2641 3.25279 10.5896 3.57823L16.4229 9.41156C16.7484 9.737 16.7484 10.2646 16.4229 10.5901L10.5896 16.4234C10.2641 16.7488 9.73651 16.7488 9.41107 16.4234C9.08563 16.098 9.08563 15.5703 9.41107 15.2449L14.5 9.99951Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        fillOpacity="0.35"
      />
      <Rect x="3.5" y="9" width="2" height="1.7" rx="0.85" fill="currentColor" fillOpacity="0.35" />
      <Rect x="6.5" y="9" width="2" height="1.7" rx="0.85" fill="currentColor" fillOpacity="0.35" />
      <Rect x="9.5" y="9" width="2" height="1.7" rx="0.85" fill="currentColor" fillOpacity="0.35" />
    </Svg>
  ),
  defaultFill: '#131313',
})
