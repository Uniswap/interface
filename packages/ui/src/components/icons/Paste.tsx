import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Paste, AnimatedPaste] = createIcon({
  name: 'Paste',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 15 14" {...props}>
      <Path
        d="M8.0835 1.16602H4.00016C3.69074 1.16602 3.394 1.28893 3.1752 1.50772C2.95641 1.72652 2.8335 2.02326 2.8335 2.33268V11.666C2.8335 11.9754 2.95641 12.2722 3.1752 12.491C3.394 12.7098 3.69074 12.8327 4.00016 12.8327H11.0002C11.3096 12.8327 11.6063 12.7098 11.8251 12.491C12.0439 12.2722 12.1668 11.9754 12.1668 11.666V5.24935L8.0835 1.16602Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <Path
        d="M8.0835 1.16602V5.24935H12.1668"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </Svg>
  ),
})
