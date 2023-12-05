import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Clipboard, AnimatedClipboard] = createIcon({
  name: 'Clipboard',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 24 24" {...props}>
      <Path
        d="M8 5.5V4.5C8 3.5 8.5 3 9.5 3H14.5C15.5 3 16 3.5 16 4.5V5.5C16 6.5 15.5 7 14.5 7H9.5C8.5 7 8 6.5 8 5.5ZM20 8V18C20 20 19 21 17 21H7C5 21 4 20 4 18V8C4 6.258 4.75189 5.27701 6.26489 5.05701C6.38589 5.03901 6.5 5.13899 6.5 5.26099V5.49902C6.5 7.31902 7.68 8.49902 9.5 8.49902H14.5C16.32 8.49902 17.5 7.31902 17.5 5.49902V5.26099C17.5 5.13899 17.6151 5.03901 17.7351 5.05701C19.2481 5.27701 20 6.258 20 8ZM15.03 11.136C14.737 10.843 14.262 10.843 13.969 11.136L11.166 13.939L10.0291 12.803C9.73605 12.51 9.26102 12.51 8.96802 12.803C8.67502 13.096 8.67502 13.571 8.96802 13.864L10.635 15.531C10.781 15.677 10.973 15.751 11.165 15.751C11.357 15.751 11.5491 15.678 11.6951 15.531L15.0281 12.198C15.3231 11.904 15.323 11.429 15.03 11.136Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
