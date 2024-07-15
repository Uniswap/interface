import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Quotes, AnimatedQuotes] = createIcon({
  name: 'Quotes',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 24 25" {...props}>
      <Path
        d="M20.84 13.612L18.27 18.742C18.1 19.082 17.75 19.292 17.38 19.292H14.81C14.44 19.292 14.2 18.902 14.36 18.572L17 13.292H14.5C13.67 13.292 13 12.622 13 11.792V6.79199C13 5.96199 13.67 5.29199 14.5 5.29199H19.5C20.33 5.29199 21 5.96199 21 6.79199V12.942C21 13.172 20.95 13.402 20.84 13.612ZM11 12.942V6.79199C11 5.96199 10.33 5.29199 9.5 5.29199H4.5C3.67 5.29199 3 5.96199 3 6.79199V11.792C3 12.622 3.67 13.292 4.5 13.292H7L4.36 18.572C4.19 18.902 4.44 19.292 4.81 19.292H7.38C7.76 19.292 8.11 19.082 8.27 18.742L10.84 13.612C10.94 13.402 11 13.172 11 12.942Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
