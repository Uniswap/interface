import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [InfoCircleFilled, AnimatedInfoCircleFilled] = createIcon({
  name: 'InfoCircleFilled',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 18 19" {...props}>
      <Path
        d="M9 1.50171C4.85775 1.50171 1.5 4.85946 1.5 9.00171C1.5 13.144 4.85775 16.5017 9 16.5017C13.1423 16.5017 16.5 13.144 16.5 9.00171C16.5 4.85946 13.1423 1.50171 9 1.50171ZM8.4375 5.62671C8.4375 5.31621 8.6895 5.06421 9 5.06421C9.3105 5.06421 9.5625 5.31621 9.5625 5.62671V9.05499C9.5625 9.36549 9.3105 9.61749 9 9.61749C8.6895 9.61749 8.4375 9.36549 8.4375 9.05499V5.62671ZM9.01501 12.3767C8.60101 12.3767 8.26117 12.0407 8.26117 11.6267C8.26117 11.2127 8.59351 10.8767 9.00751 10.8767H9.01501C9.42976 10.8767 9.76501 11.2127 9.76501 11.6267C9.76501 12.0407 9.42901 12.3767 9.01501 12.3767Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
