import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ArrowDownCircle, AnimatedArrowDownCircle] = createIcon({
  name: 'ArrowDownCircle',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 16 16" {...props}>
      <Path
        d="M8.00004 14.6667C11.6819 14.6667 14.6667 11.6819 14.6667 8.00003C14.6667 4.31813 11.6819 1.33337 8.00004 1.33337C4.31814 1.33337 1.33337 4.31813 1.33337 8.00003C1.33337 11.6819 4.31814 14.6667 8.00004 14.6667Z"
        fill={'currentColor' ?? '#FFFFFF'}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <Path
        d="M5.33337 8L8.00004 10.6667L10.6667 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <Path
        d="M8 5.33337V10.6667"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </Svg>
  ),
  defaultFill: '#FFFFFF',
})
