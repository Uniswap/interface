import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [MoreHorizontal, AnimatedMoreHorizontal] = createIcon({
  name: 'MoreHorizontal',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M4.02002 14C2.91602 14 2.01501 13.104 2.01501 12C2.01501 10.896 2.90501 10 4.01001 10H4.02002C5.12402 10 6.02002 10.896 6.02002 12C6.02002 13.104 5.12502 14 4.02002 14ZM14.02 12C14.02 10.896 13.124 10 12.02 10H12.01C10.906 10 10.015 10.896 10.015 12C10.015 13.104 10.915 14 12.02 14C13.125 14 14.02 13.104 14.02 12ZM22.02 12C22.02 10.896 21.124 10 20.02 10H20.01C18.906 10 18.015 10.896 18.015 12C18.015 13.104 18.915 14 20.02 14C21.125 14 22.02 13.104 22.02 12Z"
        fill="currentColor"
      />
    </Svg>
  ),
  defaultFill: '#9B9B9B',
})
