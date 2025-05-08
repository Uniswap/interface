import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [SortHorizontalLines, AnimatedSortHorizontalLines] = createIcon({
  name: 'SortHorizontalLines',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M20 7H4C3.447 7 3 6.552 3 6C3 5.448 3.447 5 4 5H20C20.553 5 21 5.448 21 6C21 6.552 20.553 7 20 7ZM18 12C18 11.448 17.553 11 17 11H7C6.447 11 6 11.448 6 12C6 12.552 6.447 13 7 13H17C17.553 13 18 12.552 18 12ZM15 18C15 17.448 14.553 17 14 17H10C9.447 17 9 17.448 9 18C9 18.552 9.447 19 10 19H14C14.553 19 15 18.552 15 18Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
