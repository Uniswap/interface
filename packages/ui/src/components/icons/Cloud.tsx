import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Cloud, AnimatedCloud] = createIcon({
  name: 'Cloud',
  getIcon: (props) => (
    <Svg viewBox="0 0 16 16" fill="none" {...props}>
      <Path
        d="M9.26896 5.06732L9.26891 5.06728C8.50684 4.3958 7.50577 3.9872 6.4091 3.9872C4.01716 3.9872 2.07829 5.92607 2.07829 8.318C2.07829 10.7099 4.01716 12.6488 6.4091 12.6488H10.5455C12.4092 12.6488 13.9217 11.1363 13.9217 9.27255C13.9217 7.4088 12.4092 5.89629 10.5455 5.89629C10.3683 5.89629 10.1951 5.90917 10.023 5.9349C9.81109 5.61321 9.55717 5.32144 9.26896 5.06732Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.388889"
      />
    </Svg>
  ),
})
