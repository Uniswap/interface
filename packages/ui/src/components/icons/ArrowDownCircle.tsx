import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [ArrowDownCircle, AnimatedArrowDownCircle] = createIcon({
  name: 'ArrowDownCircle',
  getIcon: (props) => (
    <Svg fill="none" height="24" viewBox="0 0 24 24" width="24" {...props}>
      <Path
        clipRule="evenodd"
        d="M1.28564 12C1.28564 6.08249 6.08243 1.28571 11.9999 1.28571C17.9174 1.28571 22.7142 6.08249 22.7142 12C22.7142 17.9175 17.9174 22.7143 11.9999 22.7143C6.08243 22.7143 1.28564 17.9175 1.28564 12ZM10.9821 7.5C10.9821 6.93786 11.4378 6.48215 12 6.48215C12.5621 6.48215 13.0178 6.93786 13.0178 7.5V14.0427L15.7802 11.2803C16.1777 10.8828 16.8222 10.8828 17.2197 11.2803C17.6172 11.6778 17.6172 12.3222 17.2197 12.7197L12.7197 17.2197C12.3222 17.6172 11.6777 17.6172 11.2802 17.2197L6.78024 12.7197C6.38274 12.3222 6.38274 11.6778 6.78024 11.2803C7.17774 10.8828 7.82221 10.8828 8.21971 11.2803L10.9821 14.0427V7.5Z"
        fill="#FC74FE"
        fillRule="evenodd"
      />
    </Svg>
  ),
})
