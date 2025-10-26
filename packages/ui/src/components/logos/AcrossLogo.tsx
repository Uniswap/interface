import { ClipPath, Defs, G, Path, Rect, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [AcrossLogo, AnimatedAcrossLogo] = createIcon({
  name: 'AcrossLogo',
  getIcon: (props) => (
    <Svg viewBox="0 0 16 16" fill="none" {...props}>
      <G clipPath="url(#clip0_3093_68949)">
        <Path
          d="M16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16C12.4183 16 16 12.4183 16 8Z"
          fill="currentColor"
        />
        <Path
          d="M11.5936 3.5L12.5 4.40642L9.47085 7.43558C9.31117 7.01975 8.98025 6.68883 8.56443 6.52915L11.5936 3.5ZM7.43558 6.52915L4.40642 3.5L3.5 4.40642L6.52915 7.43558C6.68883 7.01975 7.01975 6.68883 7.43558 6.52915ZM6.52915 8.56443L3.5 11.5936L4.40642 12.5L7.43558 9.47085C7.01975 9.31117 6.68883 8.98025 6.52915 8.56443ZM8.56443 9.47085L11.5936 12.5L12.5 11.5936L9.47085 8.56443C9.31117 8.98025 8.98025 9.31117 8.56443 9.47085Z"
          fill={'#2D2E33'}
          fillRule="evenodd"
          clipRule="evenodd"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_3093_68949">
          <Rect width="16" height="16" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  defaultFill: '#6CF9D8',
})
