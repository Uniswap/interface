import { Path, Svg } from 'react-native-svg'
// oxlint-disable-next-line universe-custom/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Fire, AnimatedFire] = createIcon({
  name: 'Fire',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12C11 10.62 10.5 10 10 9C8.92802 6.85714 9.77596 4.05357 12 2C12.5 4.5 14 6.9 16 8.5C18 10.1 19 12 19 14C19 15.8565 18.2625 17.637 16.9497 18.9497C15.637 20.2625 13.8565 21 12 21C10.1435 21 8.36301 20.2625 7.05025 18.9497C5.7375 17.637 5 15.8565 5 14C5 12.847 5.43299 11.7056 6 11C6 12.3807 7.11929 14.5 8.5 14.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
})
