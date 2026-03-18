import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ApproveAlt, AnimatedApproveAlt] = createIcon({
  name: 'ApproveAlt',
  getIcon: (props) => (
    <Svg viewBox="0 0 16 16" fill="none" {...props}>
      <Path
        d="M8.00004 1.33337C4.32004 1.33337 1.33337 4.32004 1.33337 8.00004C1.33337 11.68 4.32004 14.6667 8.00004 14.6667C11.68 14.6667 14.6667 11.68 14.6667 8.00004C14.6667 4.32004 11.68 1.33337 8.00004 1.33337ZM10.6867 6.80005L7.57336 9.9067C7.48003 10.0067 7.35336 10.0534 7.22003 10.0534C7.09336 10.0534 6.9667 10.0067 6.8667 9.9067L5.31337 8.35339C5.12004 8.16006 5.12004 7.84002 5.31337 7.64669C5.50671 7.45335 5.82671 7.45335 6.02004 7.64669L7.22003 8.84672L9.98004 6.09338C10.1734 5.89338 10.4934 5.89338 10.6867 6.09338C10.88 6.28672 10.88 6.60005 10.6867 6.80005Z"
        fill="currentColor"
      />
    </Svg>
  ),
  defaultFill: '#21C95E',
})
