import { Path, Svg } from 'react-native-svg'
import { createIcon } from '../factories/createIcon'

export const [EmptyPoolsIcon, AnimatedEmptyPoolsIcon] = createIcon({
  name: 'EmptyPoolsIcon',
  getIcon: (props) => (
    <Svg width="115" height="115" viewBox="0 0 115 115" fill="none" {...props}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M58.48 17C70.6302 17 80.48 26.8497 80.48 39C80.48 51.1503 70.6302 61 58.48 61C46.3297 61 36.48 51.1503 36.48 39C36.48 26.8497 46.3297 17 58.48 17ZM50.23 39L58.48 47.25L66.73 39L58.48 30.75L50.23 39Z"
        fill={props.color || 'currentColor'}
      />
      <Path
        d="M20 80.1986C30.4105 80.1986 38.2173 70.0581 38.2173 70.0581C38.2173 70.0581 46.0241 80.1986 56.4346 80.1986C66.8409 80.1986 77.2514 70.0581 77.2514 70.0581C77.2514 70.0581 87.6619 80.1986 95.4687 80.1986M20 99.2504C30.4105 99.2504 38.2173 89.1099 38.2173 89.1099C38.2173 89.1099 46.0241 99.2504 56.4346 99.2504C66.8409 99.2504 77.2514 89.1099 77.2514 89.1099C77.2514 89.1099 87.6619 99.2504 95.4687 99.2504"
        stroke={props.color || 'currentColor'}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.5}
      />
    </Svg>
  ),
})
