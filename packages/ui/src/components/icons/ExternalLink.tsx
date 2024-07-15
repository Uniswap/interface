import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ExternalLink, AnimatedExternalLink] = createIcon({
  name: 'ExternalLink',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 24 24" {...props}>
      <Path
        d="M21 4V9C21 9.552 20.553 10 20 10C19.447 10 19 9.552 19 9V6.41406L11.707 13.707C11.512 13.902 11.256 14 11 14C10.744 14 10.488 13.902 10.293 13.707C9.90197 13.316 9.90197 12.684 10.293 12.293L17.5859 5H15C14.447 5 14 4.552 14 4C14 3.448 14.447 3 15 3H20C20.13 3 20.2601 3.0269 20.3821 3.0769C20.6271 3.1779 20.8221 3.37292 20.9231 3.61792C20.9741 3.73992 21 3.87 21 4ZM20 12C19.447 12 19 12.448 19 13V17C19 18.439 18.439 19 17 19H7C5.561 19 5 18.439 5 17V7C5 5.561 5.561 5 7 5H11C11.553 5 12 4.552 12 4C12 3.448 11.553 3 11 3H7C4.458 3 3 4.458 3 7V17C3 19.542 4.458 21 7 21H17C19.542 21 21 19.542 21 17V13C21 12.448 20.553 12 20 12Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
