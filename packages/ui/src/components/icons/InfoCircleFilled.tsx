import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [InfoCircleFilled, AnimatedInfoCircleFilled] = createIcon({
  name: 'InfoCircleFilled',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 16 16" {...props}>
      <Path
        d="M8.00001 1.33334C4.31801 1.33334 1.33334 4.318 1.33334 8C1.33334 11.682 4.31801 14.6667 8.00001 14.6667C11.682 14.6667 14.6667 11.682 14.6667 8C14.6667 4.318 11.682 1.33334 8.00001 1.33334ZM8.50001 11C8.50001 11.276 8.27601 11.5 8.00001 11.5C7.72401 11.5 7.50001 11.276 7.50001 11V7.95264C7.50001 7.67664 7.72401 7.45264 8.00001 7.45264C8.27601 7.45264 8.50001 7.67664 8.50001 7.95264V11ZM8.01336 6.33334C7.64536 6.33334 7.34327 6.03467 7.34327 5.66667C7.34327 5.29867 7.63868 5 8.00668 5H8.01336C8.38202 5 8.68002 5.29867 8.68002 5.66667C8.68002 6.03467 8.38136 6.33334 8.01336 6.33334Z"
        fill={'currentColor' ?? '#CECECE'}
      />
    </Svg>
  ),
  defaultFill: '#CECECE',
})
