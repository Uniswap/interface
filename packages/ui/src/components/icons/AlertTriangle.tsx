import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [AlertTriangle, AnimatedAlertTriangle] = createIcon({
  name: 'AlertTriangle',
  getIcon: (props) => (
    <Svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <Path
        d="M21.6074 17.1522L15.0004 4.79599C13.7204 2.40199 10.2814 2.40199 9.00042 4.79599L2.39349 17.1522C1.21949 19.3482 2.81353 22.0001 5.30853 22.0001H18.6923C21.1863 22.0001 22.7814 19.3472 21.6074 17.1522ZM11.2504 10.0001C11.2504 9.58609 11.5864 9.25009 12.0004 9.25009C12.4144 9.25009 12.7504 9.58609 12.7504 10.0001V14.0001C12.7504 14.4141 12.4144 14.7501 12.0004 14.7501C11.5864 14.7501 11.2504 14.4141 11.2504 14.0001V10.0001ZM12.0204 18.0001C11.4684 18.0001 11.0153 17.5521 11.0153 17.0001C11.0153 16.4481 11.4584 16.0001 12.0104 16.0001H12.0204C12.5734 16.0001 13.0204 16.4481 13.0204 17.0001C13.0204 17.5521 12.5724 18.0001 12.0204 18.0001Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
