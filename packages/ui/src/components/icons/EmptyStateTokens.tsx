import { Rect, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [EmptyStateTokens, AnimatedEmptyStateTokens] = createIcon({
  name: 'EmptyStateTokens',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 66 65" {...props}>
      <Rect
        fill="currentColor"
        height="36.073"
        rx="2.327"
        transform="rotate(90 35.573 22.926)"
        width="8.463"
        x="35.573"
        y="22.926"
      />
      <Rect
        fill="currentColor"
        height="36.073"
        rx="2.327"
        transform="rotate(90 35.573 11.463)"
        width="8.463"
        x="35.573"
        y="11.463"
      />
      <Rect
        fill="currentColor"
        height="36.073"
        rx="2.327"
        transform="rotate(90 40.227 0)"
        width="8.463"
        x="40.227"
      />
      <Rect
        fill="currentColor"
        height="36.073"
        rx="2.327"
        transform="rotate(90 39.064 34.389)"
        width="8.463"
        x="39.064"
        y="34.389"
      />
      <Rect
        fill="currentColor"
        height="36.073"
        rx="2.327"
        transform="rotate(90 35.573 45.851)"
        width="8.463"
        x="35.573"
        y="45.851"
      />
    </Svg>
  ),
})
