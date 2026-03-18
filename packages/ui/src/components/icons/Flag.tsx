import { G, Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Flag, AnimatedFlag] = createIcon({
  name: 'Flag',
  getIcon: (props) => (
    <Svg viewBox="0 0 16 16" fill="none" {...props}>
      <G id="flag">
        <Path
          id="flag_2"
          d="M10 5.66667L12.6667 9.33333H3.83337V13.9733C3.83337 14.2466 3.60671 14.4733 3.33337 14.4733C3.06004 14.4733 2.83337 14.2466 2.83337 13.9733V9.33333V4C2.83337 2.66667 3.50004 2 4.83337 2H12.6667L10 5.66667Z"
          fill="currentColor"
        />
      </G>
    </Svg>
  ),
})
