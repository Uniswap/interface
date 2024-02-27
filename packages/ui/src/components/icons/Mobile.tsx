import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Mobile, AnimatedMobileSend] = createIcon({
  name: 'Mobile',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 26 32" {...props}>
      <Path
        d="M19.9999 0.25H5.99998C2.49999 0.25 0.75 1.99999 0.75 5.49998V26.4999C0.75 29.9999 2.49999 31.7499 5.99998 31.7499H19.9999C23.4999 31.7499 25.2499 29.9999 25.2499 26.4999V5.49998C25.2499 1.99999 23.4999 0.25 19.9999 0.25ZM13 28.2499C12.034 28.2499 11.25 27.4659 11.25 26.4999C11.25 25.5339 12.034 24.7499 13 24.7499C13.9659 24.7499 14.7499 25.5339 14.7499 26.4999C14.7499 27.4659 13.9659 28.2499 13 28.2499ZM15.6249 6.81247H10.375C9.65047 6.81247 9.06247 6.22448 9.06247 5.49998C9.06247 4.77548 9.65047 4.18748 10.375 4.18748H15.6249C16.3494 4.18748 16.9374 4.77548 16.9374 5.49998C16.9374 6.22448 16.3494 6.81247 15.6249 6.81247Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
