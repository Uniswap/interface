import { G, Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Map, AnimatedMap] = createIcon({
  name: 'Map',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 20 20" {...props}>
      <G clipPath="url(#clip0_8270_157937)">
        <Path
          d="M0.833252 5.00008V18.3334L6.66659 15.0001L13.3333 18.3334L19.1666 15.0001V1.66675L13.3333 5.00008L6.66659 1.66675L0.833252 5.00008Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <Path
          d="M0.833252 5.00008V18.3334L6.66659 15.0001L13.3333 18.3334L19.1666 15.0001V1.66675L13.3333 5.00008L6.66659 1.66675L0.833252 5.00008Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.6"
          strokeWidth="2"
        />
        <Path
          d="M6.66675 1.66675V15.0001"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <Path
          d="M6.66675 1.66675V15.0001"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.6"
          strokeWidth="2"
        />
        <Path
          d="M13.3333 5V18.3333"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <Path
          d="M13.3333 5V18.3333"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.6"
          strokeWidth="2"
        />
      </G>
    </Svg>
  ),
})
