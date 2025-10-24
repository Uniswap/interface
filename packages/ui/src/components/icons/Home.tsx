import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Home, AnimatedHome] = createIcon({
  name: 'Home',
  getIcon: (props) => (
    <Svg viewBox="0 0 22 22" fill="none" {...props}>
      <Path
        d="M18 21.5H14.2667C14.0731 21.5 13.9167 21.3436 13.9167 21.15V16.25C13.9167 14.6389 12.6112 13.3334 11 13.3334C9.38883 13.3334 8.08333 14.6389 8.08333 16.25V21.15C8.08333 21.3436 7.92694 21.5 7.73328 21.5H4C1.66667 21.5 0.5 20.3334 0.5 18V10.5929C0.5 8.26186 1.11023 7.90376 2.1684 7.01709L9.12638 1.18248C10.2102 0.273646 11.7911 0.273646 12.8749 1.18248L19.8329 7.01709C20.8899 7.90376 21.5011 8.26186 21.5011 10.5929V18C21.5 20.3334 20.3333 21.5 18 21.5Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </Svg>
  ),
  defaultFill: '#131313',
})
