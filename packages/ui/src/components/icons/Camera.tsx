import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Camera, AnimatedCamera] = createIcon({
  name: 'Camera',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M18 7H16L15.342 5.02588C15.138 4.41288 14.5649 4 13.9189 4H10.0811C9.43505 4 8.86196 4.41288 8.65796 5.02588L8 7H6C4 7 3 8 3 10V18C3 20 4 21 6 21H18C20 21 21 20 21 18V10C21 8 20 7 18 7ZM12 17C10.343 17 9 15.657 9 14C9 12.343 10.343 11 12 11C13.657 11 15 12.343 15 14C15 15.657 13.657 17 12 17ZM17.5 11.5C16.948 11.5 16.5 11.052 16.5 10.5C16.5 9.948 16.948 9.5 17.5 9.5C18.052 9.5 18.5 9.948 18.5 10.5C18.5 11.052 18.052 11.5 17.5 11.5Z"
        fill="currentColor"
      />
    </Svg>
  ),
  defaultFill: '#25314C',
})
