import { ClipPath, Defs, G, Path, Rect, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Pin, AnimatedPin] = createIcon({
  name: 'Pin',
  getIcon: (props) => (
    <Svg viewBox="0 0 20 20" fill="none" {...props}>
      <G clipPath="url(#clip0_2274_114663)">
        <Path
          d="M10.0674 13.0165L10.0002 20.6066L10.0674 13.0165ZM4.51472 12.7651L15.2494 12.6699L15.267 10.6883L12.8441 8.72837L13.3854 2.77867L6.55435 2.8392L6.98976 8.78083L4.53228 10.7835L4.51472 12.7651Z"
          fill="currentColor"
        />
        <Path
          d="M10.0674 13.0165L10.0002 20.6066M4.51472 12.7651L15.2494 12.6699L15.267 10.6883L12.8441 8.72837L13.3854 2.77867L6.55435 2.8392L6.98976 8.78083L4.53228 10.7835L4.51472 12.7651Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_2274_114663">
          <Rect width="20" height="20" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  defaultFill: '#FC72FF',
})
