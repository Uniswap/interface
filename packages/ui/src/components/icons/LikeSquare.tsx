import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [LikeSquare, AnimatedLikeSquare] = createIcon({
  name: 'LikeSquare',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M17.625 3H6.375C4.125 3 3 4.125 3 6.375V17.625C3 19.875 4.125 21 6.375 21H17.625C19.875 21 21 19.875 21 17.625V6.375C21 4.125 19.875 3 17.625 3ZM9 15.95C9 16.116 8.86595 16.25 8.69995 16.25H8.04004C7.60404 16.25 7.25 15.896 7.25 15.46V11.76C7.25 11.325 7.60504 10.97 8.04004 10.97H8.69995C8.86595 10.97 9 11.104 9 11.27V15.95ZM16.619 12L15.559 15.17C15.349 15.81 15.119 16.25 14.059 16.25H10.299C10.133 16.25 9.99902 16.116 9.99902 15.95V10.688C9.99902 10.656 10.004 10.625 10.014 10.594L11.099 7.28998C11.229 6.94998 11.549 6.75 11.889 6.75C12.049 6.75 12.209 6.79001 12.349 6.89001C12.789 7.18001 13.049 7.68002 13.049 8.21002V9.91998H15.119C16.699 9.91998 16.959 10.98 16.619 12Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
