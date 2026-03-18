import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [StatusIndicatorCircle, AnimatedStatusIndicatorCircle] = createIcon({
  name: 'StatusIndicatorCircle',
  getIcon: (props) => (
    <Svg viewBox="0 0 12 12" fill="none" {...props}>
      <Path
        d="M0 6C0 2.68629 2.68629 0 6 0C9.31371 0 12 2.68629 12 6C12 9.31371 9.31371 12 6 12C2.68629 12 0 9.31371 0 6Z"
        fill="currentColor"
        fillOpacity="0.6"
      />
      <Path
        d="M2 6C2 3.79086 3.79086 2 6 2C8.20914 2 10 3.79086 10 6C10 8.20914 8.20914 10 6 10C3.79086 10 2 8.20914 2 6Z"
        fill="currentColor"
      />
    </Svg>
  ),
  defaultFill: '#FF5F52',
})
