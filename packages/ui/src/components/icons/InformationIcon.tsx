import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [InformationIcon, AnimatedInformationIcon] = createIcon({
  name: 'InformationIcon',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 23 22" {...props}>
      <Path
        d="M10.5 15C10.5 15.5523 10.9477 16 11.5 16C12.0523 16 12.5 15.5523 12.5 15H10.5ZM12.5 11C12.5 10.4477 12.0523 10 11.5 10C10.9477 10 10.5 10.4477 10.5 11H12.5ZM11.5 6C10.9477 6 10.5 6.44772 10.5 7C10.5 7.55229 10.9477 8 11.5 8V6ZM11.51 8C12.0623 8 12.51 7.55229 12.51 7C12.51 6.44772 12.0623 6 11.51 6V8ZM20.5 11C20.5 15.9706 16.4706 20 11.5 20V22C17.5751 22 22.5 17.0751 22.5 11H20.5ZM11.5 20C6.52944 20 2.5 15.9706 2.5 11H0.5C0.5 17.0751 5.42487 22 11.5 22V20ZM2.5 11C2.5 6.02944 6.52944 2 11.5 2V0C5.42487 0 0.5 4.92487 0.5 11H2.5ZM11.5 2C16.4706 2 20.5 6.02944 20.5 11H22.5C22.5 4.92487 17.5751 0 11.5 0V2ZM12.5 15V11H10.5V15H12.5ZM11.5 8H11.51V6H11.5V8Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
