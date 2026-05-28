import { ClipPath, Defs, G, Path, Rect, Svg } from 'react-native-svg'
// oxlint-disable-next-line universe-custom/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [GoogleLogoGradient, AnimatedGoogleLogoGradient] = createIcon({
  name: 'GoogleLogoGradient',
  getIcon: (props) => (
    <Svg viewBox="0 0 20 20" fill="none" {...props}>
      <G clipPath="url(#clip0_10955_6746)">
        <Path
          d="M18.8 10.2083C18.8 9.55834 18.7417 8.93334 18.6333 8.33334H10V11.8833H14.9333C14.7167 13.025 14.0667 13.9917 13.0917 14.6417V16.95H16.0667C17.8 15.35 18.8 13 18.8 10.2083Z"
          fill="#4285F4"
        />
        <Path
          d="M10.0002 19.1667C12.4752 19.1667 14.5502 18.35 16.0669 16.95L13.0919 14.6417C12.2752 15.1917 11.2336 15.525 10.0002 15.525C7.6169 15.525 5.5919 13.9167 4.86689 11.75H1.81689V14.1167C3.32523 17.1083 6.41689 19.1667 10.0002 19.1667Z"
          fill="#34A853"
        />
        <Path
          d="M4.86683 11.7417C4.6835 11.1917 4.57516 10.6083 4.57516 10C4.57516 9.39166 4.6835 8.80833 4.86683 8.25833V5.89166H1.81683C1.19183 7.125 0.833496 8.51666 0.833496 10C0.833496 11.4833 1.19183 12.875 1.81683 14.1083L4.19183 12.2583L4.86683 11.7417Z"
          fill="#FBBC05"
        />
        <Path
          d="M10.0002 4.48334C11.3502 4.48334 12.5502 4.95001 13.5086 5.85001L16.1336 3.22501C14.5419 1.74168 12.4752 0.833344 10.0002 0.833344C6.41689 0.833344 3.32523 2.89168 1.81689 5.89168L4.86689 8.25834C5.59189 6.09168 7.61689 4.48334 10.0002 4.48334Z"
          fill="#EA4335"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_10955_6746">
          <Rect width="20" height="20" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  ),
})
