import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [UniswapXGeneric, AnimatedUniswapXGeneric] = createIcon({
  name: 'UniswapXGeneric',
  getIcon: (props) => (
    <Svg viewBox="0 0 20 21" fill="none" {...props}>
      <Path
        d="M16.2142 9.49751C16.1476 9.34668 15.9984 9.25001 15.8334 9.25001H12.0834V3.00001C12.0834 2.82751 11.9776 2.67252 11.8159 2.61085C11.6534 2.54835 11.4726 2.59334 11.3567 2.72084L3.85675 11.0542C3.74675 11.1767 3.71845 11.3517 3.78595 11.5025C3.85261 11.6533 4.00175 11.75 4.16675 11.75H7.91675V18C7.91675 18.1725 8.02257 18.3275 8.18424 18.3892C8.23341 18.4075 8.28342 18.4167 8.33342 18.4167C8.44925 18.4167 8.56259 18.3684 8.64343 18.2784L16.1434 9.94501C16.2534 9.82335 16.2809 9.64751 16.2142 9.49751Z"
        fill="currentColor"
      />
    </Svg>
  ),
  defaultFill: '#FF37C7',
})
