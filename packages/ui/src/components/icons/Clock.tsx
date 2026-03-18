import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Clock, AnimatedClock] = createIcon({
  name: 'Clock',
  getIcon: (props) => (
    <Svg viewBox="0 0 18 18" fill="none" {...props}>
      <Path
        d="M8.99984 0.666748C4.39734 0.666748 0.666504 4.39758 0.666504 9.00008C0.666504 13.6026 4.39734 17.3334 8.99984 17.3334C13.6023 17.3334 17.3332 13.6026 17.3332 9.00008C17.3332 4.39758 13.6023 0.666748 8.99984 0.666748ZM11.9415 11.9418C11.8199 12.0634 11.6598 12.1251 11.4998 12.1251C11.3398 12.1251 11.1798 12.0643 11.0581 11.9418L8.55815 9.44177C8.44065 9.32427 8.37484 9.16508 8.37484 9.00008V4.83341C8.37484 4.48841 8.65484 4.20841 8.99984 4.20841C9.34484 4.20841 9.62484 4.48841 9.62484 4.83341V8.74088L11.9415 11.0576C12.1857 11.3026 12.1857 11.6976 11.9415 11.9418Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </Svg>
  ),
  defaultFill: '#7D7D7D',
})
