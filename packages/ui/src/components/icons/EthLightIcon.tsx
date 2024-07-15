import { Path, Svg, Circle as _Circle } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [EthLightIcon, AnimatedEthLightIcon] = createIcon({
  name: 'EthLightIcon',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 24 24" {...props}>
      <_Circle cx="12" cy="12" fill={'currentColor' ?? '#EDF0F4'} r="12" />
      <Path
        d="M11.9673 4.8L11.8718 5.12426V14.5326L11.9673 14.6278L16.3344 12.0464L11.9673 4.8Z"
        fill={'currentColor' ?? '#343434'}
      />
      <Path
        d="M11.9672 4.8L7.59998 12.0464L11.9672 14.6278V10.0613V4.8Z"
        fill={'currentColor' ?? '#8C8C8C'}
      />
      <Path
        d="M11.9673 15.4547L11.9135 15.5203V18.8717L11.9673 19.0287L16.3371 12.8746L11.9673 15.4547Z"
        fill={'currentColor' ?? '#3C3C3B'}
      />
      <Path
        d="M11.9672 19.0287V15.4547L7.59998 12.8746L11.9672 19.0287Z"
        fill={'currentColor' ?? '#8C8C8C'}
      />
      <Path
        d="M11.9673 14.6278L16.3344 12.0464L11.9673 10.0613V14.6278Z"
        fill={'currentColor' ?? '#141414'}
      />
      <Path
        d="M7.59998 12.0464L11.9672 14.6278V10.0613L7.59998 12.0464Z"
        fill={'currentColor' ?? '#393939'}
      />
    </Svg>
  ),
  defaultFill: '#EDF0F4',
})
