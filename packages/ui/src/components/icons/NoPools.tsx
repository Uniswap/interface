import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [NoPools, AnimatedNoPools] = createIcon({
  name: 'NoPools',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 81 86" {...props}>
      <Path
        clipRule="evenodd"
        d="M40.98 44.5C53.1302 44.5 62.98 34.6503 62.98 22.5C62.98 10.3497 53.1302 0.5 40.98 0.5C28.8297 0.5 18.98 10.3497 18.98 22.5C18.98 34.6503 28.8297 44.5 40.98 44.5ZM49.23 22.5L40.98 14.25L32.73 22.5L40.98 30.75L49.23 22.5Z"
        fill="currentColor"
        fillRule="evenodd"
      />
      <Path
        d="M2.5 63.6991C12.9105 63.6991 20.7173 53.5586 20.7173 53.5586C20.7173 53.5586 28.5241 63.6991 38.9346 63.6991C49.3409 63.6991 59.7514 53.5586 59.7514 53.5586C59.7514 53.5586 70.1619 63.6991 77.9687 63.6991M2.5 82.7509C12.9105 82.7509 20.7173 72.6104 20.7173 72.6104C20.7173 72.6104 28.5241 82.7509 38.9346 82.7509C49.3409 82.7509 59.7514 72.6104 59.7514 72.6104C59.7514 72.6104 70.1619 82.7509 77.9687 82.7509"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
    </Svg>
  ),
})
