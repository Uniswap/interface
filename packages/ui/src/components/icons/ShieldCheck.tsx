import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ShieldCheck, AnimatedShieldCheck] = createIcon({
  name: 'ShieldCheck',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 19 20" {...props}>
      <Path
        d="M9.51807 0C7.27807 1.111 5.5 2 0.5 3C0.5 4.137 0.5 7.70192 0.5 8.88892C0.5 15.5559 6.167 18.889 9.5 20C12.833 18.889 18.5 15.5559 18.5 8.88892C18.5 7.66392 18.5 4.194 18.5 3C13.5 2 11.7221 1.111 9.51807 0ZM13.042 8.53003L9.04199 12.53C8.89599 12.676 8.70396 12.75 8.51196 12.75C8.31996 12.75 8.12793 12.677 7.98193 12.53L5.98193 10.53C5.68893 10.237 5.68893 9.76199 5.98193 9.46899C6.27493 9.17599 6.74997 9.17599 7.04297 9.46899L8.51294 10.939L11.9829 7.46899C12.2759 7.17599 12.7509 7.17599 13.0439 7.46899C13.3369 7.76199 13.335 8.23703 13.042 8.53003Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
