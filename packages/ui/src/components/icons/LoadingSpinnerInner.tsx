import { Path, Svg, Circle as _Circle } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [LoadingSpinnerInner, AnimatedLoadingSpinnerInner] = createIcon({
  name: 'LoadingSpinnerInner',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 80 81" {...props}>
      <Path
        d="M40.084 24.7017C42.8068 32.0598 48.6082 37.8613 55.9664 40.584C48.6082 43.3068 42.8068 49.1082 40.084 56.4664C37.3613 49.1082 31.5598 43.3068 24.2017 40.584C31.5598 37.8613 37.3613 32.0598 40.084 24.7017Z"
        fill="currentColor"
      />
      <_Circle cx="39.9999" cy="74.7858" fill="currentColor" r="5.71429" />
    </Svg>
  ),
})
