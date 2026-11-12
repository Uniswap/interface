import { createIcon } from '../factories/createIcon'
import { G, Path, Svg } from '../factories/svg-elements'

export const [File, AnimatedFile] = createIcon({
  name: 'File',
  getIcon: (props) => (
    <Svg preserveAspectRatio="none" overflow="visible" viewBox="0 0 16 16" fill="none" {...props}>
      <G id="file" preserveAspectRatio="none" overflow="visible">
        <Path
          id="Vector"
          d="M9.83333 4V2.5L12.8333 5.5H11.3333C10.28 5.5 9.83333 5.05333 9.83333 4ZM11.3333 6.5C9.72 6.5 8.83333 5.61333 8.83333 4V2H5.33333C4 2 3.33333 2.66667 3.33333 4V12C3.33333 13.3333 4 14 5.33333 14H11.3333C12.6667 14 13.3333 13.3333 13.3333 12V6.5H11.3333Z"
          fill="currentColor"
          fillOpacity="0.63"
          preserveAspectRatio="none"
          overflow="visible"
        />
      </G>
    </Svg>
  ),
  defaultFill: '#131313',
})
