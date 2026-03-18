import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [OrderRouting, AnimatedOrderRouting] = createIcon({
  name: 'OrderRouting',
  getIcon: (props) => (
    <Svg viewBox="0 0 25 24" fill="none" {...props}>
      <Path
        d="M6.5 5C5.94772 5 5.5 5.44772 5.5 6C5.5 6.55228 5.94772 7 6.5 7C7.05228 7 7.5 6.55228 7.5 6C7.5 5.44772 7.05228 5 6.5 5ZM3.5 6C3.5 4.34315 4.84315 3 6.5 3C7.80622 3 8.91746 3.83481 9.32929 5H16.5C18.7091 5 20.5 6.79086 20.5 9C20.5 11.2091 18.7091 13 16.5 13H8.5C7.39543 13 6.5 13.8954 6.5 15C6.5 16.1046 7.39543 17 8.5 17H15.6707C16.0825 15.8348 17.1938 15 18.5 15C20.1569 15 21.5 16.3431 21.5 18C21.5 19.6569 20.1569 21 18.5 21C17.1938 21 16.0825 20.1652 15.6707 19H8.5C6.29086 19 4.5 17.2091 4.5 15C4.5 12.7909 6.29086 11 8.5 11H16.5C17.6046 11 18.5 10.1046 18.5 9C18.5 7.89543 17.6046 7 16.5 7H9.32929C8.91746 8.16519 7.80622 9 6.5 9C4.84315 9 3.5 7.65685 3.5 6ZM18.5 17C17.9477 17 17.5 17.4477 17.5 18C17.5 18.5523 17.9477 19 18.5 19C19.0523 19 19.5 18.5523 19.5 18C19.5 17.4477 19.0523 17 18.5 17Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </Svg>
  ),
  defaultFill: '#9B9B9B',
})
