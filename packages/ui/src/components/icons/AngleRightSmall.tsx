import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [AngleRightSmall, AnimatedAngleRightSmall] = createIcon({
  name: 'AngleRightSmall',
  getIcon: (props) => (
    <Svg fill="currentColor" viewBox="0 0 17 16" {...props}>
      <Path
        d="M7.16661 11.3334C6.99594 11.3334 6.82526 11.268 6.69526 11.138C6.43459 10.8774 6.43459 10.456 6.69526 10.1953L8.89057 8.00002L6.69526 5.80471C6.43459 5.54405 6.43459 5.12267 6.69526 4.862C6.95592 4.60134 7.3773 4.60134 7.63796 4.862L10.3046 7.52867C10.5653 7.78934 10.5653 8.21071 10.3046 8.47138L7.63796 11.138C7.50796 11.268 7.33728 11.3334 7.16661 11.3334Z"
        fill={'currentColor' ?? '#7D7D7D'}
      />
    </Svg>
  ),
  defaultFill: '#7D7D7D',
})
