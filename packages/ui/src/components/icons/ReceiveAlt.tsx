import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ReceiveAlt, AnimatedReceiveAlt] = createIcon({
  name: 'ReceiveAlt',
  getIcon: (props) => (
    <Svg viewBox="0 0 20 20" fill="none" {...props}>
      <Path
        d="M1.07129 9.99986C1.07129 5.06861 5.06861 1.07129 9.99986 1.07129C14.9311 1.07129 18.9284 5.06861 18.9284 9.99986C18.9284 14.9311 14.9311 18.9284 9.99986 18.9284C5.06861 18.9284 1.07129 14.9311 1.07129 9.99986ZM9.15168 6.24987C9.15168 5.78142 9.53144 5.40166 9.9999 5.40166C10.4684 5.40166 10.8481 5.78142 10.8481 6.24987V11.7021L13.1501 9.40009C13.4814 9.06885 14.0184 9.06885 14.3497 9.40009C14.6809 9.73134 14.6809 10.2684 14.3497 10.5996L10.5997 14.3497C10.2684 14.6809 9.73137 14.6809 9.40012 14.3497L5.65012 10.5996C5.31887 10.2684 5.31887 9.73134 5.65012 9.40009C5.98137 9.06885 6.51843 9.06885 6.84967 9.40009L9.15168 11.7021V6.24987Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </Svg>
  ),
  defaultFill: '#7D7D7D',
})
