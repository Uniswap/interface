import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Sort, AnimatedSort] = createIcon({
  name: 'Sort',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 20 20" {...props}>
      <Path
        d="M10.8333 7.50008L14.1666 4.16675M14.1666 4.16675L17.5 7.50008M14.1666 4.16675V14.1667"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <Path
        d="M2.5 11.6667L5.83333 15M5.83333 15L9.16667 11.6667M5.83333 15V5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </Svg>
  ),
})
