import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [WavePulse, AnimatedWavePulse] = createIcon({
  name: 'WavePulse',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M8.91296 18.9999C8.22496 18.9999 7.63304 18.542 7.46204 17.87L6.22302 12.997H3C2.447 12.997 2 12.549 2 11.997C2 11.445 2.447 10.997 3 10.997H6.22302C7.13902 10.997 7.93601 11.6168 8.16101 12.5048L8.82898 15.132L10.589 5.23699C10.714 4.52899 11.305 4.01893 12.026 3.99993C12.77 3.96893 13.364 4.45784 13.527 5.15984L15.355 13.0199L15.832 12.0868C16.175 11.4148 16.857 10.997 17.613 10.997H21C21.553 10.997 22 11.445 22 11.997C22 12.549 21.553 12.997 21 12.997H17.6121L16.512 15.1489C16.222 15.7159 15.614 16.031 14.994 15.956C14.361 15.879 13.8589 15.4278 13.7159 14.8068L12.13 7.98894L10.392 17.7629C10.267 18.4659 9.68199 18.973 8.96899 18.999C8.95099 19 8.93196 18.9999 8.91296 18.9999Z"
        fill="currentColor"
      />
    </Svg>
  ),
  defaultFill: '#7D7D7D',
})
