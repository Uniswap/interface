import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [LinkHorizontalAlt, AnimatedLinkHorizontalAlt] = createIcon({
  name: 'LinkHorizontalAlt',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 25" fill="currentColor" {...props}>
      <Path
        d="M10 17.5H7C5.676 17.5 4.42202 16.982 3.46802 16.042C2.51802 15.078 2 13.824 2 12.5C2 9.743 4.243 7.5 7 7.5H8C8.553 7.5 9 7.948 9 8.5C9 9.052 8.553 9.5 8 9.5H7C5.346 9.5 4 10.846 4 12.5C4 13.295 4.31308 14.051 4.88208 14.628C5.44908 15.187 6.205 15.5 7 15.5H10C11.654 15.5 13 14.154 13 12.5C13 11.948 13.447 11.5 14 11.5C14.553 11.5 15 11.948 15 12.5C15 15.257 12.757 17.5 10 17.5Z"
        fill="currentColor"
      />
      <Path
        d="M17 17.5H16C15.447 17.5 15 17.052 15 16.5C15 15.948 15.447 15.5 16 15.5H17C18.654 15.5 20 14.154 20 12.5C20 11.705 19.6869 10.949 19.1179 10.372C18.5509 9.81301 17.795 9.5 17 9.5H14C12.346 9.5 11 10.846 11 12.5C11 13.052 10.553 13.5 10 13.5C9.447 13.5 9 13.052 9 12.5C9 9.743 11.243 7.5 14 7.5H17C18.324 7.5 19.578 8.01801 20.532 8.95801C21.482 9.92201 22 11.176 22 12.5C22 15.257 19.757 17.5 17 17.5Z"
        fill="currentColor"
      />
    </Svg>
  ),
  defaultFill: '#7D7D7D',
})
