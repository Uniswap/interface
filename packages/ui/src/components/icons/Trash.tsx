import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Trash, AnimatedTrash] = createIcon({
  name: 'Trash',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M3.5 6H5.5M5.5 6H21.5M5.5 6V20C5.5 20.5304 5.71071 21.0391 6.08579 21.4142C6.46086 21.7893 6.96957 22 7.5 22H17.5C18.0304 22 18.5391 21.7893 18.9142 21.4142C19.2893 21.0391 19.5 20.5304 19.5 20V6H5.5ZM8.5 6V4C8.5 3.46957 8.71071 2.96086 9.08579 2.58579C9.46086 2.21071 9.96957 2 10.5 2H14.5C15.0304 2 15.5391 2.21071 15.9142 2.58579C16.2893 2.96086 16.5 3.46957 16.5 4V6M10.5 11V17M14.5 11V17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
})
