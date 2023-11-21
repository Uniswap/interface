import { Path, Rect, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Unitag, AnimatedUnitag] = createIcon({
  name: 'Unitag',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 24 24" {...props}>
      <Rect
        fill={'currentColor' ?? '#FFEFFF'}
        height="22.7303"
        rx="10.2495"
        width="22.7302"
        x="0.634923"
        y="0.634923"
      />
      <Path
        d="M11.9067 17.2489C9.54223 17.2489 7.97778 15.9867 7.97778 13.3022V8.21775H10.1111V13.2844C10.1111 14.6711 10.6445 15.4356 11.9067 15.4356C13.1689 15.4356 13.7022 14.6711 13.7022 13.2844V8.21775H15.8356V13.3022C15.8356 15.9867 14.2711 17.2489 11.9067 17.2489Z"
        fill={'currentColor' ?? '#FC72FF'}
      />
      <Rect
        height="22.7303"
        rx="10.2495"
        stroke="currentColor"
        strokeWidth="1.26985"
        width="22.7302"
        x="0.634923"
        y="0.634923"
      />
    </Svg>
  ),
  defaultFill: '#FFEFFF',
})
