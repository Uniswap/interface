import { G, Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Blocked, AnimatedBlocked] = createIcon({
  name: 'Blocked',
  getIcon: (props) => (
    <Svg viewBox="0 0 20 20" fill="none" {...props}>
      <G id="Icon">
        <Path
          id="Vector"
          d="M9.99992 1.45801C5.29016 1.45801 1.45825 5.28992 1.45825 9.99967C1.45825 14.7094 5.29016 18.5413 9.99992 18.5413C14.7097 18.5413 18.5416 14.7094 18.5416 9.99967C18.5416 5.28992 14.7097 1.45801 9.99992 1.45801ZM3.39007 9.99967C3.39007 6.35563 6.35514 3.38983 9.99992 3.38983C11.4745 3.38983 12.8353 3.87768 13.936 4.69787L4.69811 13.9358C3.87793 12.835 3.39007 11.4742 3.39007 9.99967ZM9.99992 16.6095C8.52537 16.6095 7.16455 16.1217 6.06382 15.3015L15.3017 6.06362C16.1219 7.16504 16.6098 8.52586 16.6098 9.99967C16.6098 13.6437 13.6447 16.6095 9.99992 16.6095Z"
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
        />
      </G>
    </Svg>
  ),
  defaultFill: '#7D7D7D',
})
