import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Ethereum, AnimatedEthereum] = createIcon({
  name: 'Ethereum',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 8 14" {...props}>
      <Path
        d="M0.193306 6.68588L3.7445 0.915183C3.86165 0.724822 4.13835 0.724822 4.2555 0.915183L7.80669 6.68588C7.90641 6.84791 7.83204 7.06065 7.65309 7.12527L4.10189 8.40765C4.03605 8.43143 3.96395 8.43143 3.89811 8.40765L0.34691 7.12527C0.167961 7.06065 0.0935913 6.84791 0.193306 6.68588Z"
        fill="currentColor"
      />
      <Path
        d="M3.89811 9.85223L0.990768 8.80236C0.706732 8.69979 0.466231 9.03384 0.653609 9.27067L3.76473 13.2028C3.88485 13.3546 4.11516 13.3546 4.23527 13.2028L7.34639 9.27067C7.53377 9.03384 7.29327 8.69979 7.00923 8.80236L4.10189 9.85223C4.03605 9.87601 3.96395 9.87601 3.89811 9.85223Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
