import { ClipPath, Defs, G, Path, Rect, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [SlashCircle, AnimatedSlashCircle] = createIcon({
  name: 'SlashCircle',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 16 16" {...props}>
      <G clipPath="url(#clip0_702_17824)">
        <Path
          d="M8.00016 14.6667C11.6821 14.6667 14.6668 11.6819 14.6668 8.00004C14.6668 4.31814 11.6821 1.33337 8.00016 1.33337C4.31826 1.33337 1.3335 4.31814 1.3335 8.00004C1.3335 11.6819 4.31826 14.6667 8.00016 14.6667Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <Path
          d="M3.28662 3.28662L12.7133 12.7133"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_702_17824">
          <Rect fill="currentColor" height="16" width="16" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
})
