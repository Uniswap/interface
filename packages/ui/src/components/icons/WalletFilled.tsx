import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [WalletFilled, AnimatedWalletFilled] = createIcon({
  name: 'WalletFilled',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 24 24" {...props}>
      <Path
        fill="currentColor"
        d="M4 4a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H4Zm-1 8.268V11c0-.552.448-1 1.001-1H20c.553 0 1.001.448 1.001 1v1.268A1.99 1.99 0 0 0 20 12h-4c-.552 0-1.007.528-1.236 1.103-.32.804-.975 1.754-2.764 1.754-1.71 0-2.518-.868-2.806-1.647-.228-.615-.695-1.21-1.28-1.21H4a1.99 1.99 0 0 0-1 .268ZM19.999 8c.35 0 .688.06 1.001.171V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v1.171C3.313 8.061 3.65 8 4.001 8H20Z"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </Svg>
  ),
})
