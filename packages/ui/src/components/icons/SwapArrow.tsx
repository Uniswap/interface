import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [SwapArrow, AnimatedSwapArrow] = createIcon({
  name: 'SwapArrow',
  getIcon: (props) => (
    <Svg viewBox="0 0 12 17" fill="none" {...props}>
      <Path
        d="M5 4.15L8 1M8 1L11 4.15M8 1V8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 12.5L4 16M4 16L1 12.5M4 16L4 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
})
