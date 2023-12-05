import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [PencilDetailed, AnimatedPencilDetailed] = createIcon({
  name: 'PencilDetailed',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 11 11" {...props}>
      <Path
        d="M8.04818 0.56381C8.17973 0.427606 8.33709 0.318965 8.51107 0.244226C8.68506 0.169488 8.87219 0.130148 9.06154 0.128502C9.25089 0.126857 9.43868 0.162939 9.61394 0.234643C9.78919 0.306347 9.94842 0.412237 10.0823 0.546134C10.2162 0.680031 10.3221 0.839255 10.3938 1.01451C10.4655 1.18977 10.5016 1.37756 10.4999 1.56691C10.4983 1.75626 10.459 1.94339 10.3842 2.11738C10.3095 2.29136 10.2008 2.44872 10.0646 2.58027L9.4992 3.14571L7.48274 1.12925L8.04818 0.56381ZM6.47451 2.13748L0.5 8.11199V10.1284H2.51646L8.49169 4.15394L6.4738 2.13748H6.47451Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
