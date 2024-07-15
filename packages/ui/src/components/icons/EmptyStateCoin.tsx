import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [EmptyStateCoin, AnimatedEmptyStateCoin] = createIcon({
  name: 'EmptyStateCoin',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 33 33" {...props}>
      <Path
        clipRule="evenodd"
        d="M16.91 32.5c8.836 0 16-7.163 16-16s-7.164-16-16-16c-8.837 0-16 7.163-16 16s7.163 16 16 16Zm6-16-6-6-6 6 6 6 6-6Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </Svg>
  ),
})
