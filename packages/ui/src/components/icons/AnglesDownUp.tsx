import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [AnglesDownUp, AnimatedAnglesDownUp] = createIcon({
  name: 'AnglesDownUp',
  getIcon: (props) => (
    <Svg viewBox="0 0 17 16" fill="none" {...props}>
      <Path
        d="M11.5201 11.6467C11.7154 11.842 11.7154 12.1587 11.5201 12.354C11.4227 12.4514 11.2947 12.5007 11.1667 12.5007C11.0387 12.5007 10.9107 12.452 10.8134 12.354L8.50004 10.0407L6.18672 12.354C5.99139 12.5494 5.6747 12.5494 5.47937 12.354C5.28403 12.1587 5.28403 11.842 5.47937 11.6467L8.14603 8.98C8.34137 8.78466 8.65806 8.78466 8.85339 8.98L11.5201 11.6467ZM8.14668 7.02003C8.24402 7.11737 8.37204 7.16668 8.50004 7.16668C8.62804 7.16668 8.75606 7.11803 8.85339 7.02003L11.5201 4.35337C11.7154 4.15804 11.7154 3.84135 11.5201 3.64601C11.3247 3.45068 11.008 3.45068 10.8127 3.64601L8.49939 5.95933L6.18607 3.64601C5.99074 3.45068 5.67405 3.45068 5.47871 3.64601C5.28338 3.84135 5.28338 4.15804 5.47871 4.35337L8.14668 7.02003Z"
        fill={'currentColor' ?? '#CECECE'}
        stroke="currentColor"
        strokeWidth="0.4"
      />
    </Svg>
  ),
  defaultFill: '#CECECE',
})
