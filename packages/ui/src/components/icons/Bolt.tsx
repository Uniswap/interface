import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Bolt, AnimatedBolt] = createIcon({
  name: 'Bolt',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M18.3841 9.42599C18.1471 8.85499 17.6161 8.5 16.9981 8.5L14.1411 8.57001L15.8571 4.59399C16.0581 4.12899 16.0111 3.59799 15.7331 3.17599C15.4551 2.75299 14.9861 2.5 14.4801 2.5H10.0001C9.16211 2.5 8.46711 3.024 8.19511 3.843L5.57811 10.525C5.42311 10.988 5.4981 11.48 5.7841 11.876C6.0701 12.272 6.51312 12.5 7.00212 12.5L9.8261 12.434L6.94109 20.838C6.86609 21.058 6.95209 21.301 7.14909 21.424C7.23109 21.475 7.32211 21.5 7.41411 21.5C7.54311 21.5 7.67111 21.45 7.76811 21.354L18.0601 11.061C18.4961 10.624 18.6201 9.99699 18.3841 9.42599Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
