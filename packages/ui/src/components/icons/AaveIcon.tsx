import { Defs, LinearGradient, Path, Stop, Svg, Circle as _Circle } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [AaveIcon, AnimatedAaveIcon] = createIcon({
  name: 'AaveIcon',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 24 24" {...props}>
      <_Circle cx="12" cy="12" fill="url(#paint0_linear_12481_2214)" r="12" />
      <Path
        d="M17.2516 16.7814L13.1938 6.97113C12.965 6.46391 12.6248 6.21649 12.1763 6.21649H11.8175C11.3691 6.21649 11.0289 6.46391 10.8 6.97113L9.03403 11.2454H7.69795C7.29898 11.2484 6.97423 11.5701 6.97114 11.9722V11.9814C6.97423 12.3804 7.29898 12.7052 7.69795 12.7082H8.41547L6.7299 16.7814C6.69898 16.8711 6.68042 16.9639 6.68042 17.0598C6.68042 17.2887 6.75155 17.468 6.87836 17.6072C7.00516 17.7464 7.18764 17.8144 7.4165 17.8144C7.56805 17.8113 7.71341 17.7649 7.83403 17.6753C7.96393 17.5856 8.05362 17.4557 8.12475 17.3072L9.98042 12.7052H11.267C11.666 12.7021 11.9907 12.3804 11.9938 11.9783V11.9598C11.9907 11.5608 11.666 11.2361 11.267 11.233H10.5804L11.9969 7.70412L15.8567 17.3041C15.9278 17.4526 16.0175 17.5825 16.1474 17.6722C16.268 17.7619 16.4165 17.8082 16.565 17.8113C16.7938 17.8113 16.9732 17.7433 17.1031 17.6041C17.233 17.4649 17.301 17.2856 17.301 17.0567C17.3041 16.9639 17.2887 16.868 17.2516 16.7814Z"
        fill="white"
      />
      <Defs>
        <LinearGradient
          gradientUnits="userSpaceOnUse"
          id="paint0_linear_12481_2214"
          x1="13.435"
          x2="-4.42097"
          y1="-4.45626"
          y2="10.5677">
          <Stop stopColor="#B6509E" />
          <Stop offset="1" stopColor="#2EBAC6" />
        </LinearGradient>
      </Defs>
    </Svg>
  ),
})
