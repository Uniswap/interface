import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [Lightning, AnimatedLightning] = createIcon({
  name: 'Lightning',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 11 14" {...props}>
      <Path
        d="M10.4713 6.19791C10.418 6.07724 10.2987 5.99991 10.1667 5.99991H7.16666V0.999912C7.16666 0.861912 7.08201 0.737915 6.95267 0.688582C6.82267 0.638582 6.67799 0.674574 6.58532 0.776574L0.585324 7.44324C0.497324 7.54124 0.474683 7.68125 0.528683 7.80191C0.582016 7.92258 0.70133 7.99991 0.83333 7.99991H3.83333V12.9999C3.83333 13.1379 3.91799 13.2619 4.04732 13.3113C4.08665 13.3259 4.12666 13.3332 4.16666 13.3332C4.25933 13.3332 4.35 13.2946 4.41467 13.2226L10.4147 6.55591C10.5027 6.45858 10.5246 6.31791 10.4713 6.19791Z"
        fill="currentColor"
      />
    </Svg>
  ),
})
