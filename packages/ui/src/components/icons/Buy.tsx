import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Buy, AnimatedBuy] = createIcon({
  name: 'Buy',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M21 8V9.25H3V8C3 6 4 5 6 5H18C20 5 21 6 21 8ZM21 10.75V16C21 18 20 19 18 19H6C4 19 3 18 3 16V10.75H21ZM10.75 15C10.75 14.586 10.414 14.25 10 14.25H7C6.586 14.25 6.25 14.586 6.25 15C6.25 15.414 6.586 15.75 7 15.75H10C10.414 15.75 10.75 15.414 10.75 15Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
