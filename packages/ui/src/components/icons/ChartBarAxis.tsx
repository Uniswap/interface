import { G, Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ChartBarAxis, AnimatedChartBarAxis] = createIcon({
  name: 'ChartBarAxis',
  getIcon: (props) => (
    <Svg viewBox="0 0 20 20" fill="none" {...props}>
      <G id="Icon">
        <Path
          id="chart-bar"
          d="M17.5 18.125H2.5C2.155 18.125 1.875 17.845 1.875 17.5C1.875 17.155 2.155 16.875 2.5 16.875H17.5C17.845 16.875 18.125 17.155 18.125 17.5C18.125 17.845 17.845 18.125 17.5 18.125ZM11.6667 13.75V3.75C11.6667 2.91667 11.25 2.5 10.4167 2.5H9.58333C8.75 2.5 8.33333 2.91667 8.33333 3.75V13.75C8.33333 14.5833 8.75 15 9.58333 15H10.4167C11.25 15 11.6667 14.5833 11.6667 13.75ZM17.5 13.75V7.08333C17.5 6.25 17.0833 5.83333 16.25 5.83333H15.4167C14.5833 5.83333 14.1667 6.25 14.1667 7.08333V13.75C14.1667 14.5833 14.5833 15 15.4167 15H16.25C17.0833 15 17.5 14.5833 17.5 13.75ZM5.83333 13.75V9.58333C5.83333 8.75 5.41667 8.33333 4.58333 8.33333H3.75C2.91667 8.33333 2.5 8.75 2.5 9.58333V13.75C2.5 14.5833 2.91667 15 3.75 15H4.58333C5.41667 15 5.83333 14.5833 5.83333 13.75Z"
          fill="currentColor"
        />
      </G>
    </Svg>
  ),
})
