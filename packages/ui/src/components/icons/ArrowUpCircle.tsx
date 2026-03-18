import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ArrowUpCircle, AnimatedArrowUpCircle] = createIcon({
  name: 'ArrowUpCircle',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2C6.477 2 2 6.477 2 12ZM11.05 16.2C11.05 16.7247 11.4754 17.15 12 17.15C12.5247 17.15 12.95 16.7247 12.95 16.2V10.0935L15.5283 12.6717C15.8993 13.0427 16.5008 13.0427 16.8718 12.6717C17.2428 12.3007 17.2428 11.6992 16.8718 11.3282L12.6718 7.12824C12.3008 6.75724 11.6993 6.75724 11.3283 7.12824L7.12829 11.3282C6.75729 11.6992 6.75729 12.3007 7.12829 12.6717C7.49929 13.0427 8.10079 13.0427 8.47179 12.6717L11.05 10.0935V16.2Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </Svg>
  ),
})
