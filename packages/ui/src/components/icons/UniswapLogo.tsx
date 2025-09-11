import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [UniswapLogo, AnimatedUniswapLogo] = createIcon({
  name: 'UniswapLogo',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 32 32" {...props}>
      <Path
        fill="currentColor"
        d="M2.176 10.7468C0.773333 12.1495 0 14.0161 0 16.0001C0 24.8215 7.17867 32.0001 16 32.0001C21.808 32.0001 26.9067 28.8855 29.712 24.2401C28.2187 25.1735 26.4587 25.7121 24.576 25.7121C19.2213 25.7121 14.864 21.3548 14.864 16.0001C14.864 11.6268 11.808 8.5708 7.43467 8.5708C5.45067 8.5708 3.584 9.34413 2.18133 10.7468H2.176Z"
      />
      <Path
        fill="currentColor"
        d="M32.0005 16C32.0005 7.17867 24.8218 0 16.0005 0C11.7285 0 7.70713 1.664 4.68846 4.688C3.74979 5.62667 2.93913 6.66133 2.27246 7.77067C3.76579 6.832 5.53646 6.288 7.42979 6.288C12.7845 6.288 17.1418 10.6453 17.1418 16C17.1418 20.3733 20.1978 23.4293 24.5711 23.4293C28.6671 23.4293 32.0005 20.096 32.0005 16Z"
      />
    </Svg>
  ),
})
