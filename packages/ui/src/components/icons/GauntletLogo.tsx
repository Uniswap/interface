import { ClipPath, Defs, G, Path, Rect, Svg } from 'react-native-svg'
// oxlint-disable-next-line universe-custom/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [GauntletLogo, AnimatedGauntletLogo] = createIcon({
  name: 'GauntletLogo',
  getIcon: (props) => (
    <Svg viewBox="0 0 12 14" fill="none" {...props}>
      <G clipPath="url(#clip0_2417_14276)">
        <Path
          d="M4.65926 9.33324H6.98888V6.99993H4.65926V4.66662H9.31854V11.6665H2.32963V9.33324H4.65926ZM2.32963 4.66662V9.33324H0V0H9.31854V2.33318H11.648V4.66649H9.3184V2.33331H2.32963V4.66662ZM0 11.6667H2.32963V14H0V11.6667Z"
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
          fillOpacity="0.35"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_2417_14276">
          <Rect width="11.69" height="14" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
  defaultFill: '#131313',
})
