import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [InfoCircle, AnimatedInfoCircle] = createIcon({
  name: 'InfoCircle',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 24 24" {...props}>
      <Path
        d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z"
        fill={'currentColor' ?? '#99A1BD24'}
      />
      <Path
        d="M11.9851 16.75C12.3991 16.75 12.7351 16.414 12.7351 16V11.429C12.7351 11.015 12.3991 10.679 11.9851 10.679C11.5711 10.679 11.2351 11.015 11.2351 11.429V16C11.2351 16.414 11.5711 16.75 11.9851 16.75Z"
        fill="currentColor"
      />
      <Path
        d="M11 8C11 8.552 11.4531 9 12.0051 9C12.5571 9 13.0051 8.552 13.0051 8C13.0051 7.448 12.5581 7 12.0051 7H11.9951C11.4431 7 11 7.448 11 8Z"
        fill="currentColor"
      />
    </Svg>
  ),
  defaultFill: '#99A1BD24',
})
