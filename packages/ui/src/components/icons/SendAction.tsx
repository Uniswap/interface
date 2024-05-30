import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [SendAction, AnimatedSendAction] = createIcon({
  name: 'SendAction',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 24 24" {...props}>
      <Path
        d="M21.421 5.66912L18.1411 18.7892C17.6711 20.6592 16.071 21.4992 14.671 21.4992C14.661 21.4992 14.6511 21.4992 14.6511 21.4992C13.2411 21.4892 11.6311 20.6292 11.1911 18.7392L10.3311 15.0893L15.7111 9.70916C16.1011 9.31916 16.1011 8.67924 15.7111 8.28924C15.3211 7.89924 14.681 7.89924 14.291 8.28924L8.91104 13.6691L5.26107 12.8093C3.37107 12.3693 2.51106 10.7593 2.50106 9.35931C2.49106 7.94931 3.33109 6.32931 5.21109 5.85931L18.3311 2.57928C19.2011 2.35928 20.1111 2.6092 20.7511 3.2492C21.3911 3.8892 21.641 4.79912 21.421 5.66912Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
