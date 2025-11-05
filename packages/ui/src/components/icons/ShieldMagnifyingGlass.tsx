import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ShieldMagnifyingGlass, AnimatedShieldMagnifyingGlass] = createIcon({
  name: 'ShieldMagnifyingGlass',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M21 10.8889C21 17.5559 15.333 20.889 12 22C8.667 20.889 3 17.5559 3 10.8889C3 9.70192 3 6.137 3 5C8 4 9.77807 3.111 12.0181 2C14.2231 3.111 16 4 21 5C21 6.194 21 9.66392 21 10.8889ZM16.03 14.47L14.48 12.9199C14.858 12.3429 15.082 11.656 15.082 10.916C15.082 8.89502 13.437 7.24902 11.416 7.24902C9.39402 7.24902 7.74902 8.89402 7.74902 10.916C7.74902 12.938 9.39402 14.583 11.416 14.583C12.156 14.583 12.8429 14.359 13.4189 13.98L14.968 15.5291C15.114 15.6751 15.306 15.749 15.498 15.749C15.69 15.749 15.8821 15.6761 16.0281 15.5291C16.3231 15.2371 16.323 14.763 16.03 14.47ZM11.417 13.083C12.611 13.083 13.583 12.111 13.583 10.916C13.583 9.72102 12.611 8.74902 11.417 8.74902C10.222 8.74902 9.25 9.72102 9.25 10.916C9.25 12.111 10.222 13.083 11.417 13.083Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
