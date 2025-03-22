import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Minus, AnimatedMinus] = createIcon({
  name: 'Minus',
  getIcon: (props) => (
    <Svg viewBox="0 0 20 20" fill="none" {...props}>
      <Path
        d="M15.8333 10.8337H4.16659C3.70659 10.8337 3.33325 10.4603 3.33325 10.0003C3.33325 9.54033 3.70659 9.16699 4.16659 9.16699H15.8333C16.2933 9.16699 16.6666 9.54033 16.6666 10.0003C16.6666 10.4603 16.2933 10.8337 15.8333 10.8337Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
