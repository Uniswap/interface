import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ReceiveArrow, AnimatedReceiveArrow] = createIcon({
  name: 'ReceiveArrow',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 20 20" {...props}>
      <Path
        d="M13.2627 7.5V3.33333C13.2627 2.87333 12.8893 2.5 12.4293 2.5H7.42934C6.96934 2.5 6.596 2.87333 6.596 3.33333V7.5H4.57676C3.83009 7.5 3.46765 8.41165 4.01015 8.92415L9.23923 13.8642C9.6659 14.2675 10.3344 14.2675 10.761 13.8642L15.9901 8.92415C16.5326 8.41165 16.1702 7.5 15.4235 7.5H13.2627Z"
        fill="currentColor"
      />
      <Path
        d="M15.6452 18.125H4.35484C4.02097 18.125 3.75 17.845 3.75 17.5C3.75 17.155 4.02097 16.875 4.35484 16.875H15.6452C15.979 16.875 16.25 17.155 16.25 17.5C16.25 17.845 15.979 18.125 15.6452 18.125Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
