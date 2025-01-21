import { G, Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [UniswapXUncolored, AnimatedUniswapXUncolored] = createIcon({
  name: 'UniswapXUncolored',
  getIcon: (props) => (
    <Svg viewBox="0 0 20 20" fill="none" {...props}>
      <G id="Icon">
        <Path
          id="bolt-alt"
          d="M16.2146 8.99659C16.1479 8.84576 15.9988 8.7491 15.8338 8.7491H12.0838V2.4991C12.0838 2.3266 11.978 2.1716 11.8163 2.10993C11.6538 2.04743 11.4729 2.09242 11.3571 2.21992L3.85711 10.5533C3.74711 10.6758 3.71881 10.8508 3.78631 11.0016C3.85298 11.1524 4.00212 11.2491 4.16712 11.2491H7.91712V17.4991C7.91712 17.6716 8.02294 17.8266 8.18461 17.8883C8.23377 17.9066 8.28379 17.9158 8.33379 17.9158C8.44962 17.9158 8.56296 17.8674 8.64379 17.7774L16.1438 9.4441C16.2538 9.32243 16.2813 9.1466 16.2146 8.99659Z"
          fill="currentColor"
        />
      </G>
    </Svg>
  ),
})
