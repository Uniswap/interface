import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [SwapDotted, AnimatedSwapDotted] = createIcon({
  name: 'SwapDotted',
  getIcon: (props) => (
    <Svg viewBox="0 0 28 28" fill="none" {...props}>
      <Path
        d="M21 5.83333C24.8926 5.83333 17.254 5.83333 21 5.83333V5.83333ZM24.5 7C24.5 5.067 22.933 3.5 21 3.5C19.4761 3.5 18.1796 4.47394 17.6992 5.83333H9.33333C6.756 5.83333 4.66667 7.92267 4.66667 10.5C4.66667 13.0773 6.756 15.1667 9.33333 15.1667H18.6667C19.9553 15.1667 21 16.2113 21 17.5C21 18.7887 19.9553 19.8333 18.6667 19.8333H10.3008C9.82037 18.4739 8.52392 17.5 7 17.5C5.067 17.5 3.5 19.067 3.5 21C3.5 22.933 5.067 24.5 7 24.5C8.52392 24.5 9.82037 23.5261 10.3008 22.1667H18.6667C21.244 22.1667 23.3333 20.0773 23.3333 17.5C23.3333 14.9227 21.244 12.8333 18.6667 12.8333H9.33333C8.04467 12.8333 7 11.7887 7 10.5C7 9.21134 8.04467 8.16667 9.33333 8.16667H17.6992C18.1796 9.52606 19.4761 10.5 21 10.5C22.933 10.5 24.5 8.933 24.5 7ZM7 22.1667C10.5697 22.1667 3.15281 22.1667 7 22.1667V22.1667Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </Svg>
  ),
  defaultFill: '#FEF4FF',
})
