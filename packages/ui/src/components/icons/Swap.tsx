import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Swap, AnimatedSwap] = createIcon({
  name: 'Swap',
  getIcon: (props) => (
    <Svg viewBox="0 0 12 16" fill="none" {...props}>
      <Path
        d="M4.66732 4.33301L7.66732 1.33301M7.66732 1.33301L10.6673 4.33301M7.66732 1.33301V7.99967M7.33398 11.6663L4.33398 14.6663M4.33398 14.6663L1.33398 11.6663M4.33398 14.6663L4.33398 8.66634"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
})
