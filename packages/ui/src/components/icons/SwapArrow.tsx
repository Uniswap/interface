import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [SwapArrow, AnimatedSwapArrow] = createIcon({
  name: 'SwapArrow',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 12 17" {...props}>
      <Path
        d="M5 4.15L8 1M8 1L11 4.15M8 1V8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <Path
        d="M7 12.5L4 16M4 16L1 12.5M4 16L4 9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </Svg>
  ),
})
