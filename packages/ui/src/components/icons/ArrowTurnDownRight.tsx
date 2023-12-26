import { G, Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ArrowTurnDownRight, AnimatedArrowTurnDownRight] = createIcon({
  name: 'ArrowTurnDownRight',
  getIcon: (props) => (
    <Svg fill="currentColor" viewBox="0 0 25 24" {...props}>
      <G opacity="0.5">
        <Path
          d="M23.1919 14.2871C23.1539 14.3791 23.099 14.462 23.03 14.531L19.03 18.531C18.884 18.677 18.692 18.751 18.5 18.751C18.308 18.751 18.116 18.678 17.97 18.531C17.677 18.238 17.677 17.763 17.97 17.47L20.6899 14.75H7.5C5.433 14.75 3.75 13.068 3.75 11V6C3.75 5.586 4.086 5.25 4.5 5.25C4.914 5.25 5.25 5.586 5.25 6V11C5.25 12.241 6.26 13.25 7.5 13.25H20.689L17.969 10.53C17.676 10.237 17.676 9.76199 17.969 9.46899C18.262 9.17599 18.737 9.17599 19.03 9.46899L23.03 13.469C23.099 13.538 23.1539 13.6209 23.1919 13.7129C23.2679 13.8969 23.2679 14.1031 23.1919 14.2871Z"
          fill={'currentColor' ?? '#CECECE'}
        />
      </G>
    </Svg>
  ),
  defaultFill: '#CECECE',
})
