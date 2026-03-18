import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [CheckmarkCircle, AnimatedCheckmarkCircle] = createIcon({
  name: 'CheckmarkCircle',
  getIcon: (props) => (
    <Svg viewBox="0 0 17 18" fill="none" {...props}>
      <Path
        d="M8.62508 0.666664C4.02508 0.666664 0.291748 4.4 0.291748 9C0.291748 13.6 4.02508 17.3333 8.62508 17.3333C13.2251 17.3333 16.9584 13.6 16.9584 9C16.9584 4.4 13.2251 0.666664 8.62508 0.666664ZM11.9834 7.50001L8.09173 11.3833C7.97507 11.5083 7.81674 11.5667 7.65007 11.5667C7.49174 11.5667 7.3334 11.5083 7.2084 11.3833L5.26675 9.44169C5.02508 9.20002 5.02508 8.79997 5.26675 8.55831C5.50841 8.31664 5.90841 8.31664 6.15008 8.55831L7.65007 10.0583L11.1001 6.61668C11.3417 6.36668 11.7417 6.36668 11.9834 6.61668C12.2251 6.85834 12.2251 7.25001 11.9834 7.50001Z"
        fill="currentColor"
      />
    </Svg>
  ),
  defaultFill: '#2FBA61',
})
