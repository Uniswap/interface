import { Circle as _Circle, G, Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [RoundExclamation, AnimatedRoundExclamation] = createIcon({
  name: 'RoundExclamation',
  getIcon: (props) => (
    <Svg viewBox="0 0 16 16" fill="none" {...props}>
      <G id="Frame 1321322480">
        <_Circle
          id="Ellipse 714"
          cx="8"
          cy="8"
          r="6.64286"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.28571"
        />
        <G id="Vector">
          <Path
            d="M7.98573 4.57227C7.65027 4.57227 7.37801 4.83558 7.37801 5.16002V8.29471C7.37801 8.61915 7.65027 8.88247 7.98573 8.88247C8.3212 8.88247 8.59346 8.61915 8.59346 8.29471V5.16002C8.59346 4.83558 8.3212 4.57227 7.98573 4.57227Z"
            fill="white"
          />
          <Path
            d="M7.1875 10.6457C7.1875 11.0783 7.55467 11.4294 8.00196 11.4294C8.44924 11.4294 8.81226 11.0783 8.81226 10.6457C8.81226 10.2131 8.45005 9.86206 8.00196 9.86206H7.99384C7.54656 9.86206 7.1875 10.2131 7.1875 10.6457Z"
            fill="white"
          />
        </G>
      </G>
    </Svg>
  ),
  defaultFill: '#E10F0F',
})
