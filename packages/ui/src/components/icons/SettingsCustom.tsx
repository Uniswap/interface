import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [SettingsCustom, AnimatedSettingsCustom] = createIcon({
  name: 'SettingsCustom',
  getIcon: (props) => (
    <Svg width="32" height="32" viewBox="0 0 32 32" fill="none" {...props}>
      <Path
        d="M17.3334 19.3333H11.3334M20.6667 12.6667H14.6667"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17.3334 19.3333C17.3334 20.4372 18.2295 21.3333 19.3334 21.3333C20.4372 21.3333 21.3334 20.4372 21.3334 19.3333C21.3334 18.2295 20.4372 17.3333 19.3334 17.3333C18.2295 17.3333 17.3334 18.2295 17.3334 19.3333V19.3333"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.6667 12.6667C10.6667 13.7705 11.5629 14.6667 12.6667 14.6667C13.7706 14.6667 14.6667 13.7705 14.6667 12.6667C14.6667 11.5628 13.7706 10.6667 12.6667 10.6667C11.5629 10.6667 10.6667 11.5628 10.6667 12.6667V12.6667"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),
  defaultFill: '#94A3B8',
})
