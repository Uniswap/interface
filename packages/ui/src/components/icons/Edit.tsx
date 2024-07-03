import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Edit, AnimatedEdit] = createIcon({
  name: 'Edit',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M16 21.75H6C3.582 21.75 2.25 20.418 2.25 18V7.99998C2.25 5.58198 3.582 4.24998 6 4.24998H9C9.414 4.24998 9.75 4.58598 9.75 4.99998C9.75 5.41398 9.414 5.74998 9 5.74998H6C4.423 5.74998 3.75 6.42298 3.75 7.99998V18C3.75 19.577 4.423 20.25 6 20.25H16C17.577 20.25 18.25 19.577 18.25 18V15C18.25 14.586 18.586 14.25 19 14.25C19.414 14.25 19.75 14.586 19.75 15V18C19.75 20.418 18.418 21.75 16 21.75ZM20.58 5.02997L18.97 3.41999C18.4 2.85999 17.49 2.85997 16.92 3.42997L15.57 4.78998L19.21 8.42997L20.57 7.07996C21.14 6.50996 21.14 5.59997 20.58 5.02997ZM14.51 5.84998L8 12.39V16H11.61L18.15 9.48997L14.51 5.84998Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
