import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [DownloadAlt, AnimatedDownloadAlt] = createIcon({
  name: 'DownloadAlt',
  getIcon: (props) => (
    <Svg viewBox="0 0 19 18" fill="none" {...props}>
      <Path
        d="M4.48401 8.03174C3.99576 7.57049 4.32196 6.74925 4.99396 6.75H6.81055V3C6.81055 2.586 7.14655 2.25 7.56055 2.25H12.0605C12.4745 2.25 12.8105 2.586 12.8105 3V6.75H14.756C15.428 6.75 15.7542 7.57049 15.266 8.03174L10.5598 12.4778C10.1758 12.8408 9.57494 12.8408 9.19019 12.4778L4.48401 8.03174ZM15.125 15.1875H4.625C4.3145 15.1875 4.0625 15.4395 4.0625 15.75C4.0625 16.0605 4.3145 16.3125 4.625 16.3125H15.125C15.4355 16.3125 15.6875 16.0605 15.6875 15.75C15.6875 15.4395 15.4355 15.1875 15.125 15.1875Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
