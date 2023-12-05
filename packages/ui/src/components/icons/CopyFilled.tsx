import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [CopyFilled, AnimatedCopyFilled] = createIcon({
  name: 'CopyFilled',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 29 28" {...props}>
      <Path
        d="M11.8542 8.16667H20.4583V6.5625C20.4583 4.52083 19.4375 3.5 17.3958 3.5H7.1875C5.14583 3.5 4.125 4.52083 4.125 6.5625V16.7708C4.125 18.8125 5.14583 19.8333 7.1875 19.8333H8.79167V11.2292C8.79167 9.1875 9.8125 8.16667 11.8542 8.16667Z"
        fill="currentColor"
      />
      <Path
        d="M22.0623 8.16699H20.4582H11.854C9.81234 8.16699 8.7915 9.18783 8.7915 11.2295V19.8337V21.4378C8.7915 23.4795 9.81234 24.5003 11.854 24.5003H22.0623C24.104 24.5003 25.1248 23.4795 25.1248 21.4378V11.2295C25.1248 9.18783 24.104 8.16699 22.0623 8.16699Z"
        fill="currentColor"
        opacity="0.4"
      />
    </Svg>
  ),
})
