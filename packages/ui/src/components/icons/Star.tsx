import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Star, AnimatedStar] = createIcon({
  name: 'Star',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 18 17" {...props}>
      <Path
        d="M8.10313 2.48362C8.46997 1.74045 9.52971 1.74045 9.89654 2.48362L11.3424 5.41275C11.4879 5.7076 11.7691 5.91206 12.0945 5.95961L15.3294 6.43244C16.1493 6.55229 16.4761 7.56013 15.8825 8.13829L13.5433 10.4167C13.3074 10.6464 13.1998 10.9775 13.2554 11.3021L13.8073 14.5196C13.9474 15.3366 13.0898 15.9595 12.3562 15.5737L9.46529 14.0534C9.17391 13.9002 8.82577 13.9002 8.53439 14.0534L5.64347 15.5737C4.90984 15.9595 4.05229 15.3366 4.19241 14.5196L4.74426 11.3021C4.79992 10.9775 4.69226 10.6464 4.45638 10.4167L2.11718 8.13829C1.52359 7.56013 1.85037 6.55229 2.67029 6.43244L5.9052 5.95961C6.23056 5.91206 6.51174 5.7076 6.65728 5.41275L8.10313 2.48362Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
})
